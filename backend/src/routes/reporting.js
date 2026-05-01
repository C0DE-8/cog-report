const express = require("express");
const pool = require("../config/db");

const router = express.Router();

function isValidMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function logValidationError(req, message, details = {}) {
  console.warn("[reporting] Validation failed", {
    method: req.method,
    path: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.body,
    message,
    details
  });
}

function logControllerError(req, error, context) {
  console.error("[reporting] Controller error", {
    method: req.method,
    path: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.body,
    context,
    errorMessage: error.message,
    stack: error.stack
  });
}

function sendValidationError(req, res, message, details = {}) {
  logValidationError(req, message, details);

  return res.status(400).json({
    message,
    details
  });
}

function parseNonNegativeNumber(value) {
  const parsed = Number(value || 0);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

async function getStatusRecord(connection, { statusId, status }) {
  if (statusId) {
    const [rows] = await connection.query(
      "SELECT id, name FROM publisher_statuses WHERE id = ? LIMIT 1",
      [statusId]
    );

    return rows[0] || null;
  }

  if (status) {
    const [rows] = await connection.query(
      "SELECT id, name FROM publisher_statuses WHERE name = ? LIMIT 1",
      [status]
    );

    return rows[0] || null;
  }

  return null;
}

async function getMonthlyReportById(reportId) {
  const [rows] = await pool.query(
    `SELECT id, user_id AS userId, report_month AS month, is_present AS isPresent,
      hours, bible_studies AS bibleStudies
    FROM monthly_reports
    WHERE id = ?
    LIMIT 1`,
    [reportId]
  );

  return rows[0] || null;
}

router.post("/groups", async (req, res) => {
  try {
    const { name, overseer } = req.body;

    if (!name || !overseer) {
      return sendValidationError(
        req,
        res,
        "Group name and group overseer are required",
        {
          requiredFields: ["name", "overseer"]
        }
      );
    }

    const [result] = await pool.query(
      "INSERT INTO groups (name, overseer) VALUES (?, ?)",
      [name.trim(), overseer.trim()]
    );

    return res.status(201).json({
      message: "Group created successfully",
      group: {
        id: result.insertId,
        name: name.trim(),
        overseer: overseer.trim()
      }
    });
  } catch (error) {
    logControllerError(req, error, "create group");
    return res.status(500).json({ message: "Failed to create group" });
  }
});

router.get("/groups", async (req, res) => {
  try {
    const [groups] = await pool.query(
      `SELECT
        g.id,
        g.name,
        g.overseer,
        COUNT(ru.id) AS memberCount
      FROM groups g
      LEFT JOIN report_users ru ON ru.group_id = g.id
      GROUP BY g.id, g.name, g.overseer
      ORDER BY g.name ASC`
    );

    return res.status(200).json({ groups });
  } catch (error) {
    logControllerError(req, error, "fetch groups");
    return res.status(500).json({ message: "Failed to fetch groups" });
  }
});

router.get("/statuses", async (req, res) => {
  try {
    const [statuses] = await pool.query(
      "SELECT id, name FROM publisher_statuses ORDER BY id ASC"
    );

    return res.status(200).json({ statuses });
  } catch (error) {
    logControllerError(req, error, "fetch statuses");
    return res.status(500).json({ message: "Failed to fetch statuses" });
  }
});

router.put("/groups/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, overseer } = req.body;

    if (!name || !overseer) {
      return sendValidationError(
        req,
        res,
        "Group name and group overseer are required",
        {
          requiredFields: ["name", "overseer"],
          groupId: id
        }
      );
    }

    const [result] = await pool.query(
      "UPDATE groups SET name = ?, overseer = ? WHERE id = ?",
      [name.trim(), overseer.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    return res.status(200).json({
      message: "Group updated successfully"
    });
  } catch (error) {
    logControllerError(req, error, "update group");
    return res.status(500).json({ message: "Failed to update group" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { groupId, statusId, status, name } = req.body;

    if (!groupId || !name || (!statusId && !status)) {
      return sendValidationError(
        req,
        res,
        "Group, status, and name are required",
        {
          requiredFields: ["groupId", "name", "statusId or status"]
        }
      );
    }

    const [groups] = await pool.query(
      "SELECT id FROM groups WHERE id = ? LIMIT 1",
      [groupId]
    );

    if (groups.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    const statusRecord = await getStatusRecord(pool, { statusId, status });

    if (!statusRecord) {
      return sendValidationError(req, res, "Invalid status", {
        providedStatusId: statusId || null,
        providedStatus: status || null
      });
    }

    const [userResult] = await pool.query(
      `INSERT INTO report_users (group_id, name, status, status_id)
      VALUES (?, ?, ?, ?)`,
      [groupId, name.trim(), statusRecord.name, statusRecord.id]
    );

    return res.status(201).json({
      message: "User added successfully",
      user: {
        id: userResult.insertId,
        groupId: Number(groupId),
        name: name.trim(),
        status: statusRecord.name,
        statusId: statusRecord.id
      }
    });
  } catch (error) {
    logControllerError(req, error, "create user");
    return res.status(500).json({ message: "Failed to add user" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT
        ru.id,
        ru.name,
        ru.status_id AS statusId,
        ps.name AS status,
        ru.group_id AS groupId,
        g.name AS groupName,
        g.overseer AS groupOverseer,
        mr.id AS reportId,
        mr.report_month AS month,
        mr.is_present AS isPresent,
        mr.hours,
        mr.bible_studies AS bibleStudies
      FROM report_users ru
      INNER JOIN groups g ON g.id = ru.group_id
      INNER JOIN publisher_statuses ps ON ps.id = ru.status_id
      LEFT JOIN monthly_reports mr ON mr.user_id = ru.id
      ORDER BY ru.name ASC, mr.report_month DESC`
    );

    return res.status(200).json({ users });
  } catch (error) {
    logControllerError(req, error, "fetch users");
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId, statusId, status, name } = req.body;

    if (!groupId || !name || (!statusId && !status)) {
      return sendValidationError(
        req,
        res,
        "Group, status, and name are required",
        {
          requiredFields: ["groupId", "name", "statusId or status"],
          userId: id
        }
      );
    }

    const [groupRows] = await pool.query(
      "SELECT id FROM groups WHERE id = ? LIMIT 1",
      [groupId]
    );

    if (groupRows.length === 0) {
      return res.status(404).json({ message: "Group not found" });
    }

    const statusRecord = await getStatusRecord(pool, { statusId, status });

    if (!statusRecord) {
      return sendValidationError(req, res, "Invalid status", {
        userId: id,
        providedStatusId: statusId || null,
        providedStatus: status || null
      });
    }

    const [userResult] = await pool.query(
      `UPDATE report_users
      SET group_id = ?, name = ?, status = ?, status_id = ?
      WHERE id = ?`,
      [groupId, name.trim(), statusRecord.name, statusRecord.id, id]
    );

    if (userResult.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    logControllerError(req, error, "update user");
    return res.status(500).json({ message: "Failed to update user" });
  }
});

router.post("/users/:id/reports", async (req, res) => {
  try {
    const { id } = req.params;
    const { month, hours, bibleStudies, isPresent } = req.body;

    if (!month) {
      return sendValidationError(req, res, "Month is required", {
        userId: id,
        expectedFormat: "YYYY-MM",
        receivedMonth: month ?? null
      });
    }

    if (!isValidMonth(month)) {
      return sendValidationError(req, res, "Month must use YYYY-MM format", {
        userId: id,
        expectedFormat: "YYYY-MM",
        receivedMonth: month
      });
    }

    const parsedHours = parseNonNegativeNumber(hours);
    const parsedBibleStudies = parseNonNegativeNumber(bibleStudies);

    if (parsedHours === null || parsedBibleStudies === null) {
      return sendValidationError(
        req,
        res,
        "Hours and bible studies must be non-negative numbers",
        {
          userId: id,
          receivedHours: hours ?? null,
          receivedBibleStudies: bibleStudies ?? null
        }
      );
    }

    const [users] = await pool.query(
      "SELECT id FROM report_users WHERE id = ? LIMIT 1",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const shouldMarkPresent = Boolean(isPresent);
    const hasEntryValues = parsedHours > 0 || parsedBibleStudies > 0;

    if (!shouldMarkPresent && !hasEntryValues) {
      return sendValidationError(
        req,
        res,
        "Mark the publisher as present or add hours or bible studies",
        {
          userId: id,
          month
        }
      );
    }

    await pool.query(
      `INSERT INTO monthly_reports
      (user_id, report_month, is_present, hours, bible_studies)
      VALUES (?, ?, ?, 0, 0)
      ON DUPLICATE KEY UPDATE
        is_present = GREATEST(is_present, VALUES(is_present)),
        updated_at = CURRENT_TIMESTAMP`,
      [id, month, shouldMarkPresent ? 1 : 0]
    );

    const [reports] = await pool.query(
      "SELECT id FROM monthly_reports WHERE user_id = ? AND report_month = ? LIMIT 1",
      [id, month]
    );

    const reportId = reports[0].id;
    let entry = null;

    if (hasEntryValues) {
      const [entryResult] = await pool.query(
        `INSERT INTO monthly_report_entries
        (monthly_report_id, hours, bible_studies)
        VALUES (?, ?, ?)`,
        [reportId, parsedHours, parsedBibleStudies]
      );

      await pool.query(
        `UPDATE monthly_reports
        SET
          hours = hours + ?,
          bible_studies = bible_studies + ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [parsedHours, parsedBibleStudies, reportId]
      );

      entry = {
        id: entryResult.insertId,
        hours: parsedHours,
        bibleStudies: parsedBibleStudies
      };
    }

    const report = await getMonthlyReportById(reportId);

    return res.status(201).json({
      message: "Report saved successfully",
      report,
      entry
    });
  } catch (error) {
    logControllerError(req, error, "create report");
    return res.status(500).json({ message: "Failed to save report" });
  }
});

router.put("/reports/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { month, isPresent } = req.body;

    if (!month) {
      return sendValidationError(req, res, "Month is required", {
        reportId,
        expectedFormat: "YYYY-MM",
        receivedMonth: month ?? null
      });
    }

    if (!isValidMonth(month)) {
      return sendValidationError(req, res, "Month must use YYYY-MM format", {
        reportId,
        expectedFormat: "YYYY-MM",
        receivedMonth: month
      });
    }

    const [result] = await pool.query(
      `UPDATE monthly_reports
      SET report_month = ?, is_present = ?
      WHERE id = ?`,
      [month, isPresent ? 1 : 0, reportId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({ message: "Report updated successfully" });
  } catch (error) {
    logControllerError(req, error, "update report");
    return res.status(500).json({ message: "Failed to update report" });
  }
});

router.get("/reports/:reportId/entries", async (req, res) => {
  try {
    const report = await getMonthlyReportById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const [entries] = await pool.query(
      `SELECT
        id,
        hours,
        bible_studies AS bibleStudies,
        created_at AS createdAt
      FROM monthly_report_entries
      WHERE monthly_report_id = ?
      ORDER BY created_at DESC, id DESC`,
      [req.params.reportId]
    );

    return res.status(200).json({
      report,
      entries
    });
  } catch (error) {
    logControllerError(req, error, "fetch report entries");
    return res.status(500).json({ message: "Failed to fetch report history" });
  }
});

router.post("/reports/:reportId/entries", async (req, res) => {
  try {
    const report = await getMonthlyReportById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const parsedHours = parseNonNegativeNumber(req.body.hours);
    const parsedBibleStudies = parseNonNegativeNumber(req.body.bibleStudies);

    if (parsedHours === null || parsedBibleStudies === null) {
      return sendValidationError(
        req,
        res,
        "Hours and bible studies must be non-negative numbers",
        {
          reportId: req.params.reportId,
          receivedHours: req.body.hours ?? null,
          receivedBibleStudies: req.body.bibleStudies ?? null
        }
      );
    }

    if (parsedHours === 0 && parsedBibleStudies === 0) {
      return sendValidationError(
        req,
        res,
        "Add at least hours or bible studies to create a history entry",
        {
          reportId: req.params.reportId
        }
      );
    }

    const [entryResult] = await pool.query(
      `INSERT INTO monthly_report_entries
      (monthly_report_id, hours, bible_studies)
      VALUES (?, ?, ?)`,
      [req.params.reportId, parsedHours, parsedBibleStudies]
    );

    await pool.query(
      `UPDATE monthly_reports
      SET
        hours = hours + ?,
        bible_studies = bible_studies + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [parsedHours, parsedBibleStudies, req.params.reportId]
    );

    return res.status(201).json({
      message: "Activity entry added successfully",
      entry: {
        id: entryResult.insertId,
        reportId: Number(req.params.reportId),
        hours: parsedHours,
        bibleStudies: parsedBibleStudies
      }
    });
  } catch (error) {
    logControllerError(req, error, "add report entry");
    return res.status(500).json({ message: "Failed to add report entry" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM report_users WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    logControllerError(req, error, "delete user");
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;
