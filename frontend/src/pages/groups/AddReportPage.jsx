import { useEffect, useState } from "react";
import {
  createUserReport,
  getGroups,
  getReportingUsers,
  updateUserReport
} from "../../api/reporting";
import styles from "./GroupsPage.module.css";

const initialReportForm = {
  userId: "",
  reportId: null,
  month: "",
  hours: "",
  bibleStudies: ""
};

function AddReportPage() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [reportForm, setReportForm] = useState(initialReportForm);
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

  const handleReportChange = (event) => {
    const { name, value } = event.target;
    setReportForm((current) => ({ ...current, [name]: value }));
  };

  const handleEditReport = (user) => {
    setReportForm({
      userId: String(user.id),
      reportId: user.reportId,
      month: user.month || "",
      hours: user.hours ?? "",
      bibleStudies: user.bibleStudies ?? ""
    });
  };

  const handleAddReport = (user) => {
    setReportForm({
      userId: String(user.id),
      reportId: null,
      month: "",
      hours: "",
      bibleStudies: ""
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        month: reportForm.month,
        hours: Number(reportForm.hours || 0),
        bibleStudies: Number(reportForm.bibleStudies || 0)
      };

      const response = reportForm.reportId
        ? await updateUserReport(reportForm.reportId, payload)
        : await createUserReport(reportForm.userId, payload);

      setMessage(response.data.message);
      setReportForm(initialReportForm);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save report");
    }
  };

  return (
    <section className={styles.pageGrid}>
      <article className={styles.card}>
        <p className={styles.kicker}>Add Report</p>
        <h2 className={styles.heading}>
          {reportForm.reportId ? "Update monthly report" : "Add monthly report"}
        </h2>

        {message ? <div className={styles.message}>{message}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
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
              value={reportForm.userId}
              onChange={handleReportChange}
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
              value={reportForm.month}
              onChange={handleReportChange}
            />
          </label>

          <label className={styles.label}>
            Hours
            <input
              className={styles.input}
              name="hours"
              type="number"
              min="0"
              step="0.5"
              value={reportForm.hours}
              onChange={handleReportChange}
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
              value={reportForm.bibleStudies}
              onChange={handleReportChange}
              placeholder="0"
            />
          </label>

          <button className={styles.primaryButton} type="submit">
            {reportForm.reportId ? "Save report" : "Add report"}
          </button>
        </form>
      </article>

      <article className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.kicker}>Reports</p>
            <h2 className={styles.heading}>Pick a publisher from the selected group</h2>
            <p className={styles.copy}>
              Use the table to jump straight into adding or editing monthly reports.
            </p>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Group</th>
                <th>Status</th>
                <th>Month</th>
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
                  <td>{user.status}</td>
                  <td>{user.month || "-"}</td>
                  <td>{user.hours ?? "-"}</td>
                  <td>{user.bibleStudies ?? "-"}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.textButton}
                      onClick={() =>
                        user.reportId ? handleEditReport(user) : handleAddReport(user)
                      }
                    >
                      {user.reportId ? "Edit report" : "Add report"}
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
      </article>
    </section>
  );
}

export default AddReportPage;
