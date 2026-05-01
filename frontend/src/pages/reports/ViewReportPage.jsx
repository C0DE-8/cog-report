import { useEffect, useMemo, useState } from "react";
import { getGroups, getReportingUsers } from "../../api/reporting";
import styles from "../groups/GroupsPage.module.css";
import { exportReportWorkbook } from "../../utils/exportReportWorkbook";

function getCurrentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function ViewReportPage() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue);
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [preachFilter, setPreachFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      setMessage("");

      try {
        const [groupsResponse, usersResponse] = await Promise.all([
          getGroups(),
          getReportingUsers()
        ]);

        setGroups(groupsResponse.data.groups || []);
        setUsers(usersResponse.data.users || []);
      } catch (error) {
        setGroups([]);
        setUsers([]);
        setMessage(error.response?.data?.message || "Failed to load reports");
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesMonth = user.month === selectedMonth;
      const matchesGroup =
        selectedGroupId === "all" || String(user.groupId) === selectedGroupId;
      const matchesPreach =
        preachFilter === "all" ||
        (preachFilter === "yes" && Boolean(user.isPresent)) ||
        (preachFilter === "no" && !user.isPresent);

      return matchesMonth && matchesGroup && matchesPreach;
    });
  }, [preachFilter, selectedGroupId, selectedMonth, users]);

  const totals = useMemo(
    () =>
      filteredUsers.reduce(
        (summary, user) => ({
          hours: summary.hours + (user.isPresent ? Number(user.hours || 0) : 0),
          bibleStudies:
            summary.bibleStudies + (user.isPresent ? Number(user.bibleStudies || 0) : 0),
          count: summary.count + 1
        }),
        { hours: 0, bibleStudies: 0, count: 0 }
      ),
    [filteredUsers]
  );

  const selectedGroupName =
    selectedGroupId === "all"
      ? "All"
      : groups.find((group) => String(group.id) === selectedGroupId)?.name || "All";

  const preachLabel =
    preachFilter === "all" ? "All" : preachFilter === "yes" ? "Yes" : "No";

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      setMessage("There is no report data to export for the current filters");
      return;
    }

    exportReportWorkbook({
      fileName: `view-report-${selectedMonth}.xlsx`,
      month: selectedMonth,
      groupName: selectedGroupName,
      preachLabel,
      rows: filteredUsers.map((user) => ({
        name: user.name,
        groupName: user.groupName,
        status: user.status,
        preach: user.isPresent ? "Yes" : "No",
        hours: user.isPresent ? Number(user.hours || 0) : "-",
        bibleStudies: user.isPresent ? Number(user.bibleStudies || 0) : "-"
      }))
    });
  };

  const renderLoadingRows = () =>
    Array.from({ length: 5 }, (_, index) => (
      <tr key={`report-loading-${index}`}>
        <td colSpan="6" className={styles.loadingCell}>
          <div className={styles.skeletonRow}>
            <span className={styles.skeletonBlock} />
            <span className={styles.skeletonBlockShort} />
          </div>
        </td>
      </tr>
    ));

  return (
    <section className={styles.page}>
      <article className={styles.card}>
        <div className={styles.headerStack}>
          <div>
            <p className={styles.kicker}>View Report</p>
            <h1 className={styles.heading}>Monthly reporting view</h1>
            <p className={styles.copy}>
              Review submitted reports by month and preaching activity without opening the entry grid.
            </p>
          </div>

          <div className={styles.filterControls}>
            <input
              className={styles.input}
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />

            <select
              className={styles.input}
              value={selectedGroupId}
              onChange={(event) => setSelectedGroupId(event.target.value)}
            >
              <option value="all">Group: All</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            <select
              className={styles.input}
              value={preachFilter}
              onChange={(event) => setPreachFilter(event.target.value)}
            >
              <option value="all">Preach: All</option>
              <option value="yes">Preach: Yes</option>
              <option value="no">Preach: No</option>
            </select>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleExport}
            >
              Export to Excel
            </button>
          </div>
        </div>

        {message ? <p className={styles.message}>{message}</p> : null}

        <div className={styles.matrixSummary}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Selected Period</span>
            <strong>{selectedMonth}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Group Filter</span>
            <strong>{selectedGroupName}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Preach Filter</span>
            <strong>{preachLabel}</strong>
          </div>
        </div>

        <div className={styles.filteredGrid}>
          <article className={styles.metricCard}>
            <span>Total Hours</span>
            <strong>{totals.hours.toFixed(1)}</strong>
          </article>

          <article className={styles.metricCard}>
            <span>Total BS</span>
            <strong>{totals.bibleStudies}</strong>
          </article>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Group</th>
                <th>Status</th>
                <th>Preach</th>
                <th>Hours</th>
                <th>BS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? renderLoadingRows()
                : filteredUsers.map((user) => (
                    <tr key={`${user.id}-${user.reportId || "none"}`}>
                      <td>{user.name}</td>
                      <td>{user.groupName}</td>
                      <td>{user.status}</td>
                      <td>{user.isPresent ? "Yes" : "No"}</td>
                      <td>{user.isPresent ? Number(user.hours || 0).toFixed(1) : "-"}</td>
                      <td>{user.isPresent ? user.bibleStudies || 0 : "-"}</td>
                    </tr>
                  ))}
              {!isLoading && filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.emptyCell}>
                    No reports matched the selected month and preach filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default ViewReportPage;
