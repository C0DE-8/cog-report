import { useEffect, useState } from "react";
import {
  createReportEntry,
  createUserReport,
  getGroups,
  getReportEntries,
  getReportingUsers,
  updateUserReport
} from "../../api/reporting";
import styles from "./GroupsPage.module.css";

const initialMonthlyForm = {
  userId: "",
  reportId: null,
  month: "",
  isPresent: false
};

const initialEntryForm = {
  reportId: null,
  hours: "",
  bibleStudies: ""
};

function AddReportPage() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [monthlyForm, setMonthlyForm] = useState(initialMonthlyForm);
  const [entryForm, setEntryForm] = useState(initialEntryForm);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const [groupsResponse, usersResponse] = await Promise.all([
        getGroups(),
        getReportingUsers()
      ]);

      setGroups(groupsResponse.data.groups);
      setUsers(usersResponse.data.users);
    } catch (error) {
      setMessage("Failed to load reporting data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers =
    selectedGroupId === "all"
      ? users
      : users.filter((user) => String(user.groupId) === selectedGroupId);

  const reportableUsers = filteredUsers.filter(
    (user, index, array) => array.findIndex((entry) => entry.id === user.id) === index
  );

  const loadHistory = async (reportId) => {
    if (!reportId) {
      setHistory([]);
      return;
    }

    try {
      const response = await getReportEntries(reportId);
      setHistory(response.data.entries);
    } catch (error) {
      setHistory([]);
      setMessage(error.response?.data?.message || "Failed to load report history");
    }
  };

  const handleMonthlyChange = (event) => {
    const { name, value, type, checked } = event.target;
    setMonthlyForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleEntryChange = (event) => {
    const { name, value } = event.target;
    setEntryForm((current) => ({ ...current, [name]: value }));
  };

  const selectExistingReport = (user) => {
    setMonthlyForm({
      userId: String(user.id),
      reportId: user.reportId,
      month: user.month || "",
      isPresent: Boolean(user.isPresent)
    });
    setEntryForm({
      reportId: user.reportId,
      hours: "",
      bibleStudies: ""
    });
    loadHistory(user.reportId);
  };

  const prepareNewMonth = (user) => {
    setMonthlyForm({
      userId: String(user.id),
      reportId: null,
      month: "",
      isPresent: false
    });
    setEntryForm(initialEntryForm);
    setHistory([]);
  };

  const handleMonthlySubmit = async (event) => {
    event.preventDefault();

    try {
      let response;

      if (monthlyForm.reportId) {
        response = await updateUserReport(monthlyForm.reportId, {
          month: monthlyForm.month,
          isPresent: monthlyForm.isPresent
        });
      } else {
        response = await createUserReport(monthlyForm.userId, {
          month: monthlyForm.month,
          isPresent: monthlyForm.isPresent,
          hours: 0,
          bibleStudies: 0
        });
      }

      const nextReportId =
        response.data.report?.id || monthlyForm.reportId || entryForm.reportId;

      setMessage(response.data.message);
      setMonthlyForm((current) => ({
        ...current,
        reportId: nextReportId
      }));
      setEntryForm((current) => ({
        ...current,
        reportId: nextReportId
      }));
      await loadData();
      await loadHistory(nextReportId);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save monthly status");
    }
  };

  const handleEntrySubmit = async (event) => {
    event.preventDefault();

    try {
      if (!entryForm.reportId) {
        setMessage("Create or load a monthly report first");
        return;
      }

      const response = await createReportEntry(entryForm.reportId, {
        hours: Number(entryForm.hours || 0),
        bibleStudies: Number(entryForm.bibleStudies || 0)
      });

      setMessage(response.data.message);
      setEntryForm((current) => ({
        ...current,
        hours: "",
        bibleStudies: ""
      }));
      await loadData();
      await loadHistory(entryForm.reportId);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add activity entry");
    }
  };

  return (
    <section className={styles.pageGrid}>
      <div className={styles.sideStack}>
        <article className={styles.card}>
          <p className={styles.kicker}>Monthly Status</p>
          <h2 className={styles.heading}>Mark attendance for a month</h2>

          {message ? <div className={styles.message}>{message}</div> : null}

          <form className={styles.form} onSubmit={handleMonthlySubmit}>
            <label className={styles.label}>
              Group
              <select
                className={styles.input}
                value={selectedGroupId}
                onChange={(event) => setSelectedGroupId(event.target.value)}
              >
                <option value="all">All groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Publisher
              <select
                className={styles.input}
                name="userId"
                value={monthlyForm.userId}
                onChange={handleMonthlyChange}
              >
                <option value="">Select publisher</option>
                {reportableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.groupName})
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Month
              <input
                className={styles.input}
                name="month"
                type="month"
                value={monthlyForm.month}
                onChange={handleMonthlyChange}
              />
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="isPresent"
                checked={monthlyForm.isPresent}
                onChange={handleMonthlyChange}
              />
              Mark publisher as present for this month
            </label>

            <button className={styles.primaryButton} type="submit">
              {monthlyForm.reportId ? "Update month" : "Create month"}
            </button>
          </form>
        </article>

        <article className={styles.card}>
          <p className={styles.kicker}>Incremental Entry</p>
          <h2 className={styles.heading}>Add hours and bible studies over time</h2>
          <p className={styles.copy}>
            Each submission below creates a separate history row and rolls up into
            the monthly total.
          </p>

          <form className={styles.form} onSubmit={handleEntrySubmit}>
            <label className={styles.label}>
              Hours
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
              Bible studies
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
        </article>
      </div>

      <article className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.kicker}>Monthly Reports</p>
            <h2 className={styles.heading}>Pick a month and inspect the build-up</h2>
            <p className={styles.copy}>
              Load an existing month to review attendance, totals, and the entry-by-entry history.
            </p>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Group</th>
                <th>Month</th>
                <th>Present</th>
                <th>Hours</th>
                <th>BS</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={`${user.id}-${user.reportId || "none"}`}>
                  <td>{user.name}</td>
                  <td>{user.groupName}</td>
                  <td>{user.month || "-"}</td>
                  <td>{user.isPresent ? "Yes" : "No"}</td>
                  <td>{user.hours ?? "-"}</td>
                  <td>{user.bibleStudies ?? "-"}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() =>
                        user.reportId ? selectExistingReport(user) : prepareNewMonth(user)
                      }
                    >
                      {user.reportId ? "Load month" : "Create month"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyCell}>
                    No publishers are available for this group yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className={styles.historySection}>
          <div className={styles.panelHeader}>
            <h3>Reporting history</h3>
            <span>{history.length} entries</span>
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
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td>{entry.hours}</td>
                    <td>{entry.bibleStudies}</td>
                  </tr>
                ))}
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={styles.emptyCell}>
                      No activity entries have been logged for the selected month yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </section>
  );
}

export default AddReportPage;
