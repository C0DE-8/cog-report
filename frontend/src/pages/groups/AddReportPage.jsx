import { useEffect, useMemo, useState } from "react";
import {
  createReportEntry,
  createUserReport,
  getGroups,
  getReportEntries,
  getReportMatrix,
  updateUserReport
} from "../../api/reporting";
import styles from "./GroupsPage.module.css";

const initialEntryForm = {
  hours: "",
  bibleStudies: ""
};

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(month) {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });
}

function AddReportPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [history, setHistory] = useState([]);
  const [entryForm, setEntryForm] = useState(initialEntryForm);
  const [message, setMessage] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadGroups() {
      setIsLoadingGroups(true);
      setMessage("");

      try {
        const response = await getGroups();

        if (!isActive) {
          return;
        }

        const nextGroups = response.data.groups || [];
        setGroups(nextGroups);
        setSelectedGroupId(nextGroups[0] ? String(nextGroups[0].id) : "");
      } catch (error) {
        if (isActive) {
          setMessage(error.response?.data?.message || "Failed to load groups");
          setGroups([]);
          setSelectedGroupId("");
        }
      } finally {
        if (isActive) {
          setIsLoadingGroups(false);
        }
      }
    }

    loadGroups();

    return () => {
      isActive = false;
    };
  }, []);

  const reportMap = useMemo(() => {
    const nextMap = new Map();

    reports.forEach((report) => {
      nextMap.set(`${report.userId}-${report.month}`, report);
    });

    return nextMap;
  }, [reports]);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const matrixRows = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        month: {
          value: selectedMonth,
          report: reportMap.get(`${user.id}-${selectedMonth}`) || null
        }
      })),
    [reportMap, selectedMonth, users]
  );

  const loadHistory = async (reportId) => {
    if (!reportId) {
      setHistory([]);
      return;
    }

    setIsLoadingHistory(true);

    try {
      const response = await getReportEntries(reportId);
      setHistory(response.data.entries || []);
    } catch (error) {
      setHistory([]);
      setMessage(error.response?.data?.message || "Failed to load report history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const syncSelectedCell = (nextUsers, nextReports, baseCell) => {
    if (!baseCell) {
      setSelectedCell(null);
      setHistory([]);
      return;
    }

    const nextUser = nextUsers.find((user) => user.id === baseCell.userId);
    const nextReport =
      nextReports.find(
        (report) => report.userId === baseCell.userId && report.month === baseCell.month
      ) || null;

    if (!nextUser) {
      setSelectedCell(null);
      setHistory([]);
      return;
    }

    const nextCell = {
      userId: nextUser.id,
      userName: nextUser.name,
      status: nextUser.status,
      month: baseCell.month,
      reportId: nextReport?.id || null,
      hours: nextReport?.hours || 0,
      bibleStudies: nextReport?.bibleStudies || 0,
      isPresent: Boolean(nextReport?.isPresent),
      entryCount: nextReport?.entryCount || 0
    };

    setSelectedCell(nextCell);

    if (nextCell.reportId) {
      loadHistory(nextCell.reportId);
    } else {
      setHistory([]);
    }
  };

  const loadMatrix = async (baseCell = selectedCell) => {
    if (!selectedGroupId) {
      setUsers([]);
      setReports([]);
      setSelectedCell(null);
      setHistory([]);
      return;
    }

    setIsLoadingMatrix(true);
    setMessage("");

    try {
      const response = await getReportMatrix({
        groupId: selectedGroupId,
        month: selectedMonth
      });

      const nextUsers = response.data.users || [];
      const nextReports = response.data.reports || [];

      setUsers(nextUsers);
      setReports(nextReports);
      syncSelectedCell(nextUsers, nextReports, baseCell);
    } catch (error) {
      setUsers([]);
      setReports([]);
      setSelectedCell(null);
      setHistory([]);
      setMessage(error.response?.data?.message || "Failed to load reporting matrix");
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  useEffect(() => {
    loadMatrix(null);
  }, [selectedGroupId, selectedMonth]);

  const totals = useMemo(
    () =>
      reports.reduce(
        (summary, report) => ({
          hours: summary.hours + Number(report.hours || 0),
          bibleStudies: summary.bibleStudies + Number(report.bibleStudies || 0),
          activeCells: summary.activeCells + 1
        }),
        { hours: 0, bibleStudies: 0, activeCells: 0 }
      ),
    [reports]
  );

  const handleEntryChange = (event) => {
    const { name, value } = event.target;
    setEntryForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleCellSelect = (user, month) => {
    const nextCell = {
      userId: user.id,
      userName: user.name,
      status: user.status,
      month: month.value,
      reportId: month.report?.id || null,
      hours: month.report?.hours || 0,
      bibleStudies: month.report?.bibleStudies || 0,
      isPresent: Boolean(month.report?.isPresent),
      entryCount: month.report?.entryCount || 0
    };

    setSelectedCell(nextCell);
    setEntryForm(initialEntryForm);

    if (nextCell.reportId) {
      loadHistory(nextCell.reportId);
    } else {
      setHistory([]);
    }
  };

  const handlePresenceSave = async () => {
    if (!selectedCell) {
      return;
    }

    try {
      let response;

      if (selectedCell.reportId) {
        response = await updateUserReport(selectedCell.reportId, {
          month: selectedCell.month,
          isPresent: selectedCell.isPresent
        });
      } else {
        response = await createUserReport(selectedCell.userId, {
          month: selectedCell.month,
          isPresent: selectedCell.isPresent,
          hours: 0,
          bibleStudies: 0
        });
      }

      setMessage(response.data.message);
      await loadMatrix(selectedCell);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save monthly record");
    }
  };

  const handleEntrySubmit = async (event) => {
    event.preventDefault();

    if (!selectedCell) {
      return;
    }

    try {
      let reportId = selectedCell.reportId;
      const payload = {
        hours: Number(entryForm.hours || 0),
        bibleStudies: Number(entryForm.bibleStudies || 0)
      };

      if (!reportId) {
        const response = await createUserReport(selectedCell.userId, {
          month: selectedCell.month,
          isPresent: selectedCell.isPresent,
          hours: payload.hours,
          bibleStudies: payload.bibleStudies
        });

        reportId = response.data.report?.id || null;

        setMessage(response.data.message);
      } else {
        const response = await createReportEntry(reportId, payload);
        setMessage(response.data.message);
      }

      setEntryForm(initialEntryForm);
      await loadMatrix({ ...selectedCell, reportId });
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add activity entry");
    }
  };

  return (
    <section className={styles.pageGrid}>
      <article className={styles.card}>
        <div className={styles.headerStack}>
          <div>
            <p className={styles.kicker}>Reporting Matrix</p>
            <h1 className={styles.heading}>Spreadsheet-style monthly activity</h1>
            <p className={styles.copy}>
              The grid opens on the current month and can jump to any month-year
              combination while keeping one persistent record per publisher/month.
            </p>
          </div>

          <div className={styles.matrixToolbar}>
            <label className={styles.label}>
              Group
              <select
                className={styles.input}
                value={selectedGroupId}
                onChange={(event) => setSelectedGroupId(event.target.value)}
                disabled={isLoadingGroups || groups.length === 0}
              >
                <option value="">Select group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Month / Year
              <input
                className={styles.input}
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </label>
          </div>
        </div>

        {message ? <div className={styles.message}>{message}</div> : null}

        <div className={styles.matrixSummary}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Selected Period</span>
            <strong>{formatMonthLabel(selectedMonth)}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total Hours</span>
            <strong>{totals.hours}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Total BS</span>
            <strong>{totals.bibleStudies}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Publishers With Records</span>
            <strong>{totals.activeCells}</strong>
          </div>
        </div>

        <div className={styles.matrixWrap}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                <th className={styles.stickyColumn}>Publisher</th>
                <th>{formatMonthLabel(selectedMonth)}</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingMatrix ? (
                Array.from({ length: 5 }, (_, rowIndex) => (
                  <tr key={`matrix-loading-${rowIndex}`}>
                    <td className={styles.stickyColumn}>
                      <span className={styles.skeletonBlock} />
                    </td>
                    <td>
                      <span className={styles.matrixSkeleton} />
                    </td>
                  </tr>
                ))
              ) : matrixRows.length > 0 ? (
                matrixRows.map((user) => (
                  <tr key={user.id}>
                    <td className={styles.stickyColumn}>
                      <div className={styles.publisherCell}>
                        <strong>{user.name}</strong>
                        <span>{user.status}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={
                          selectedCell?.userId === user.id &&
                          selectedCell?.month === user.month.value
                            ? styles.matrixCellActive
                            : styles.matrixCell
                        }
                        onClick={() => handleCellSelect(user, user.month)}
                      >
                        <span className={styles.matrixCellTop}>
                          {user.month.report?.isPresent ? "Present" : "No entry"}
                        </span>
                        <span className={styles.matrixMetric}>
                          Hrs {user.month.report?.hours || 0}
                        </span>
                        <span className={styles.matrixMetric}>
                          BS {user.month.report?.bibleStudies || 0}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className={styles.emptyCell}>
                    No publishers are assigned to this group yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <aside className={styles.sideStack}>
        <article className={styles.card}>
          <p className={styles.kicker}>Selected Cell</p>
          <h2 className={styles.heading}>Monthly record details</h2>
          <p className={styles.copy}>
            Select a cell to mark attendance, add incremental activity, and review
            the history for that month.
          </p>

          {selectedCell ? (
            <>
              <div className={styles.cellInspector}>
                <div>
                  <span className={styles.summaryLabel}>Publisher</span>
                  <strong>{selectedCell.userName}</strong>
                </div>
                <div>
                  <span className={styles.summaryLabel}>Month</span>
                  <strong>{selectedCell.month}</strong>
                </div>
                <div>
                  <span className={styles.summaryLabel}>Totals</span>
                  <strong>
                    {selectedCell.hours} hrs / {selectedCell.bibleStudies} BS
                  </strong>
                </div>
              </div>

              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={selectedCell.isPresent}
                  onChange={(event) =>
                    setSelectedCell((current) => ({
                      ...current,
                      isPresent: event.target.checked
                    }))
                  }
                />
                Mark publisher as present for this month
              </label>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={handlePresenceSave}
              >
                {selectedCell.reportId ? "Update monthly status" : "Create monthly record"}
              </button>

              <form className={styles.form} onSubmit={handleEntrySubmit}>
                <label className={styles.label}>
                  Hours to add
                  <input
                    className={styles.input}
                    name="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={entryForm.hours}
                    onChange={handleEntryChange}
                    placeholder="0"
                  />
                </label>

                <label className={styles.label}>
                  Bible studies to add
                  <input
                    className={styles.input}
                    name="bibleStudies"
                    type="number"
                    min="0"
                    value={entryForm.bibleStudies}
                    onChange={handleEntryChange}
                    placeholder="0"
                  />
                </label>

                <button className={styles.primaryButton} type="submit">
                  Add activity entry
                </button>
              </form>
            </>
          ) : (
            <p className={styles.emptyState}>
              Choose a month cell from the spreadsheet to manage that record.
            </p>
          )}
        </article>

        <article className={styles.card}>
          <div className={styles.panelHeader}>
            <h3>Entry history</h3>
            <span>{history.length} rows</span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Logged At</th>
                  <th>Hours</th>
                  <th>Bible Studies</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan="3" className={styles.loadingCell}>
                      Loading history...
                    </td>
                  </tr>
                ) : history.length > 0 ? (
                  history.map((entry) => (
                    <tr key={entry.id}>
                      <td>{new Date(entry.createdAt).toLocaleString()}</td>
                      <td>{entry.hours}</td>
                      <td>{entry.bibleStudies}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className={styles.emptyCell}>
                      No incremental entries have been logged for this month yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </aside>
    </section>
  );
}

export default AddReportPage;
