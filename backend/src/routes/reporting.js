const express = require("express");
const pool = require("../config/db");

const router = express.Router();

function isValidMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
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

router.post("/groups", async (req, res) => {
  try {
    const { name, overseer } = req.body;

    if (!name || !overseer) {
      return res.status(400).json({
        message: "Group name and group overseer are required"
      });
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
    return res.status(500).json({ message: "Failed to fetch statuses" });
  }
});

router.put("/groups/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, overseer } = req.body;

    if (!name || !overseer) {
      return res.status(400).json({
        message: "Group name and group overseer are required"
      });
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
    return res.status(500).json({ message: "Failed to update group" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { groupId, statusId, status, name } = req.body;

    if (!groupId || !name || (!statusId && !status)) {
      return res.status(400).json({
        message: "Group, status, and name are required"
      });
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
      return res.status(400).json({ message: "Invalid status" });
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
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { groupId, statusId, status, name } = req.body;

    if (!groupId || !name || (!statusId && !status)) {
      return res.status(400).json({
        message: "Group, status, and name are required"
      });
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
      return res.status(400).json({ message: "Invalid status" });
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
    return res.status(500).json({ message: "Failed to update user" });
  }
});

router.post("/users/:id/reports", async (req, res) => {
  try {
    const { id } = req.params;
    const { month, hours, bibleStudies } = req.body;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    if (!isValidMonth(month)) {
      return res.status(400).json({
        message: "Month must use YYYY-MM format"
      });
    }

    const parsedHours = Number(hours || 0);
    const parsedBibleStudies = Number(bibleStudies || 0);

    if (Number.isNaN(parsedHours) || Number.isNaN(parsedBibleStudies)) {
      return res.status(400).json({
        message: "Hours and bible studies must be numbers"
      });
    }

    const [users] = await pool.query(
      "SELECT id FROM report_users WHERE id = ? LIMIT 1",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [result] = await pool.query(
      `INSERT INTO monthly_reports (user_id, report_month, hours, bible_studies)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        hours = VALUES(hours),
        bible_studies = VALUES(bible_studies),
        updated_at = CURRENT_TIMESTAMP`,
      [id, month, parsedHours, parsedBibleStudies]
    );

    return res.status(201).json({
      message: "Report saved successfully",
      report: {
        id: result.insertId || null,
        userId: Number(id),
        month,
        hours: parsedHours,
        bibleStudies: parsedBibleStudies
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save report" });
  }
});

router.put("/reports/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const { month, hours, bibleStudies } = req.body;

    if (!month) {
      return res.status(400).json({ message: "Month is required" });
    }

    if (!isValidMonth(month)) {
      return res.status(400).json({
        message: "Month must use YYYY-MM format"
      });
    }

    const parsedHours = Number(hours || 0);
    const parsedBibleStudies = Number(bibleStudies || 0);

    if (Number.isNaN(parsedHours) || Number.isNaN(parsedBibleStudies)) {
      return res.status(400).json({
        message: "Hours and bible studies must be numbers"
      });
    }

    const [result] = await pool.query(
      `UPDATE monthly_reports
      SET report_month = ?, hours = ?, bible_studies = ?
      WHERE id = ?`,
      [month, parsedHours, parsedBibleStudies, reportId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.status(200).json({ message: "Report updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update report" });
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
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;
