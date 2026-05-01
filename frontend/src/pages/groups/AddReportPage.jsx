import { useEffect, useMemo, useState } from "react";
import {
  createReportEntry,
  createUserReport,
  getGroups,
  getReportMatrix,
  updateUserReport
} from "../../api/reporting";
import styles from "./GroupsPage.module.css";

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
  const [rowDrafts, setRowDrafts] = useState({});
  const [savingRows, setSavingRows] = useState({});
  const [message, setMessage] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);

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

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const reportMap = useMemo(() => {
    const nextMap = new Map();

    reports.forEach((report) => {
      nextMap.set(report.userId, report);
    });

    return nextMap;
  }, [reports]);

  const tableRows = useMemo(
    () =>
      users.map((user) => {
        const report = reportMap.get(user.id) || null;
        const draft = rowDrafts[user.id] || {
          isPresent: Boolean(report?.isPresent),
          hours: "",
          bibleStudies: ""
        };

        return {
          ...user,
          report,
          draft
        };
      }),
    [reportMap, rowDrafts, users]
  );

  const totals = useMemo(
    () =>
      reports.reduce(
        (summary, report) => ({
          hours: summary.hours + Number(report.hours || 0),
          bibleStudies: summary.bibleStudies + Number(report.bibleStudies || 0),
          activePublishers: summary.activePublishers + (report.isPresent ? 1 : 0)
        }),
        { hours: 0, bibleStudies: 0, activePublishers: 0 }
      ),
    [reports]
  );

  const hydrateDrafts = (nextUsers, nextReports) => {
    const nextReportMap = new Map();
    nextReports.forEach((report) => {
      nextReportMap.set(report.userId, report);
    });

    setRowDrafts(
      nextUsers.reduce((accumulator, user) => {
        const report = nextReportMap.get(user.id);
        accumulator[user.id] = {
          isPresent: Boolean(report?.isPresent),
          hours: "",
          bibleStudies: ""
        };
        return accumulator;
      }, {})
    );
  };

  const loadMatrix = async () => {
    if (!selectedGroupId) {
      setUsers([]);
      setReports([]);
      setRowDrafts({});
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
      hydrateDrafts(nextUsers, nextReports);
    } catch (error) {
      setUsers([]);
      setReports([]);
      setRowDrafts({});
      setMessage(error.response?.data?.message || "Failed to load reporting grid");
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, [selectedGroupId, selectedMonth]);

  const updateDraft = (userId, field, value) => {
    setRowDrafts((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        [field]: value
      }
    }));
  };

  const handleSaveRow = async (row) => {
    const draft = row.draft;
    const parsedHours = Number(draft.hours || 0);
    const parsedBibleStudies = Number(draft.bibleStudies || 0);

    if (Number.isNaN(parsedHours) || Number.isNaN(parsedBibleStudies)) {
      setMessage("Hours and Bible studies must be valid numbers");
      return;
    }

    if (!row.report && !draft.isPresent && parsedHours === 0 && parsedBibleStudies === 0) {
      setMessage("Mark the publisher active or enter hours or Bible studies first");
      return;
    }

    setSavingRows((current) => ({ ...current, [row.id]: true }));

    try {
      let reportId = row.report?.id || null;

      if (reportId) {
        await updateUserReport(reportId, {
          month: selectedMonth,
          isPresent: draft.isPresent
        });
      } else {
        const response = await createUserReport(row.id, {
          month: selectedMonth,
          isPresent: draft.isPresent,
          hours: parsedHours,
          bibleStudies: parsedBibleStudies
        });

        reportId = response.data.report?.id || null;
      }

      if (reportId && (row.report ? parsedHours > 0 || parsedBibleStudies > 0 : false)) {
        await createReportEntry(reportId, {
          hours: parsedHours,
          bibleStudies: parsedBibleStudies
        });
      }

      setMessage(`Saved ${row.name}'s ${formatMonthLabel(selectedMonth)} report`);
      await loadMatrix();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save monthly report");
    } finally {
      setSavingRows((current) => ({ ...current, [row.id]: false }));
    }
  };

  return (
    <section className={styles.page}>
      <article className={styles.card}>
        <div className={styles.headerStack}>
          <div>
            <p className={styles.kicker}>Add Report</p>
            <h1 className={styles.heading}>Compact monthly reporting grid</h1>
            <p className={styles.copy}>
              Update activity inline for the selected month. Mark publishers active and
              enter hours or Bible studies directly in the spreadsheet.
            </p>
          </div>

          <div className={styles.matrixToolbar}>
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

        {isLoadingGroups ? (
          <div className={styles.tabsShell} aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={`report-tab-${index}`} className={styles.tabSkeleton} />
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className={styles.tabsRow} role="tablist" aria-label="Reporting groups">
            {groups.map((group) => {
              const isActive = String(group.id) === selectedGroupId;

              return (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={isActive ? styles.tabActive : styles.tab}
                  onClick={() => setSelectedGroupId(String(group.id))}
                >
                  <span>{group.name}</span>
                  <span className={styles.tabMeta}>{group.memberCount} publishers</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyState}>No groups are available yet.</p>
        )}

        <div className={styles.matrixSummary}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Selected Group</span>
            <strong>{selectedGroup?.name || "None selected"}</strong>
          </div>
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
        </div>

        <div className={styles.matrixWrap}>
          <table className={styles.compactTable}>
            <thead>
              <tr>
                <th>Publisher</th>
                <th>Status</th>
                <th>Preach</th>
                <th>Total Hrs</th>
                <th>Total BS</th>
                <th>Add Hrs</th>
                <th>Add BS</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingMatrix ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={`compact-loading-${index}`}>
                    <td colSpan="8" className={styles.loadingCell}>
                      <div className={styles.skeletonRow}>
                        <span className={styles.skeletonBlock} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : tableRows.length > 0 ? (
                tableRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className={styles.publisherInline}>
                        <strong>{row.name}</strong>
                      </div>
                    </td>
                    <td>{row.status}</td>
                    <td>
                      <label className={styles.inlineCheckbox}>
                        <input
                          type="checkbox"
                          checked={row.draft.isPresent}
                          onChange={(event) =>
                            updateDraft(row.id, "isPresent", event.target.checked)
                          }
                        />
                        <span>{row.draft.isPresent ? "Yes" : "No"}</span>
                      </label>
                    </td>
                    <td>{row.report?.hours || 0}</td>
                    <td>{row.report?.bibleStudies || 0}</td>
                    <td>
                      <input
                        className={styles.compactInput}
                        type="number"
                        min="0"
                        step="0.5"
                        value={row.draft.hours}
                        onChange={(event) => updateDraft(row.id, "hours", event.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input
                        className={styles.compactInput}
                        type="number"
                        min="0"
                        value={row.draft.bibleStudies}
                        onChange={(event) =>
                          updateDraft(row.id, "bibleStudies", event.target.value)
                        }
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.inlineSaveButton}
                        onClick={() => handleSaveRow(row)}
                        disabled={Boolean(savingRows[row.id])}
                      >
                        {savingRows[row.id] ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className={styles.emptyCell}>
                    No publishers are assigned to this group yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className={styles.matrixHint}>
          Tip: use the checkbox to mark monthly activity, then enter hours or Bible
          studies inline and save the row.
        </p>
      </article>
    </section>
  );
}

export default AddReportPage;
