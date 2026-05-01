import { useEffect, useState } from "react";
import {
  createGroup,
  createUserReport,
  createReportingUser,
  deleteReportingUser,
  getGroups,
  getStatuses,
  getReportingUsers,
  updateReportingUser,
  updateUserReport
} from "../../api/reporting";
import styles from "./ReportingPage.module.css";

const initialGroupForm = {
  name: "",
  overseer: ""
};

const initialUserForm = {
  groupId: "",
  statusId: "",
  name: ""
};

const initialReportForm = {
  userId: "",
  reportId: null,
  month: "",
  hours: "",
  bibleStudies: ""
};

function ReportingPage() {
  const [groups, setGroups] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [groupForm, setGroupForm] = useState(initialGroupForm);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [message, setMessage] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);

  const loadData = async () => {
    try {
      const [groupsResponse, statusesResponse, usersResponse] = await Promise.all([
        getGroups(),
        getStatuses(),
        getReportingUsers()
      ]);

      setGroups(groupsResponse.data.groups);
      setStatuses(statusesResponse.data.statuses);
      setUsers(usersResponse.data.users);
    } catch (error) {
      setMessage("Failed to load reporting data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGroupChange = (event) => {
    const { name, value } = event.target;
    setGroupForm((current) => ({ ...current, [name]: value }));
  };

  const handleUserChange = (event) => {
    const { name, value } = event.target;
    setUserForm((current) => ({ ...current, [name]: value }));
  };

  const handleReportChange = (event) => {
    const { name, value } = event.target;
    setReportForm((current) => ({ ...current, [name]: value }));
  };

  const handleGroupSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await createGroup(groupForm);
      setMessage(response.data.message);
      setGroupForm(initialGroupForm);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create group");
    }
  };

  const resetUserForm = () => {
    setUserForm(initialUserForm);
    setEditingUserId(null);
  };

  const resetReportForm = () => {
    setReportForm(initialReportForm);
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingUserId) {
        const response = await updateReportingUser(editingUserId, userForm);
        setMessage(response.data.message);
      } else {
        const response = await createReportingUser(userForm);
        setMessage(response.data.message);
      }

      resetUserForm();
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save user");
    }
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        month: reportForm.month,
        hours: Number(reportForm.hours || 0),
        bibleStudies: Number(reportForm.bibleStudies || 0)
      };

      let response;

      if (reportForm.reportId) {
        response = await updateUserReport(reportForm.reportId, payload);
      } else {
        response = await createUserReport(reportForm.userId, payload);
      }

      setMessage(response.data.message);
      resetReportForm();
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save report");
    }
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      groupId: String(user.groupId),
      statusId: String(user.statusId),
      name: user.name
    });
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

  const handleDeleteUser = async (id) => {
    try {
      const response = await deleteReportingUser(id);
      setMessage(response.data.message);
      if (editingUserId === id) {
        resetUserForm();
      }
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <section className={styles.layout}>
      <div className={styles.formsColumn}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>Step 1</span>
            <h2>Create a group first</h2>
          </div>

          <form className={styles.form} onSubmit={handleGroupSubmit}>
            <label className={styles.label}>
              Group name
              <input
                className={styles.input}
                name="name"
                value={groupForm.name}
                onChange={handleGroupChange}
                placeholder="North Group"
              />
            </label>

            <label className={styles.label}>
              Group overseer
              <input
                className={styles.input}
                name="overseer"
                value={groupForm.overseer}
                onChange={handleGroupChange}
                placeholder="Overseer name"
              />
            </label>

            <button className={styles.primaryButton} type="submit">
              Save group
            </button>
          </form>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>Step 2</span>
            <h2>{editingUserId ? "Update publisher" : "Add publisher"}</h2>
          </div>

          <form className={styles.form} onSubmit={handleUserSubmit}>
            <label className={styles.label}>
              Group
              <select
                className={styles.input}
                name="groupId"
                value={userForm.groupId}
                onChange={handleUserChange}
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
              Status
              <select
                className={styles.input}
                name="statusId"
                value={userForm.statusId}
                onChange={handleUserChange}
              >
                <option value="">Select status</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Name
              <input
                className={styles.input}
                name="name"
                value={userForm.name}
                onChange={handleUserChange}
                placeholder="Publisher name"
              />
            </label>

            <div className={styles.buttonRow}>
              <button className={styles.primaryButton} type="submit">
                {editingUserId ? "Update user" : "Save user"}
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={resetUserForm}
              >
                Clear form
              </button>
            </div>
          </form>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>Step 3</span>
            <h2>{reportForm.reportId ? "Update report" : "Add report"}</h2>
          </div>

          <form className={styles.form} onSubmit={handleReportSubmit}>
            <label className={styles.label}>
              Publisher
              <select
                className={styles.input}
                name="userId"
                value={reportForm.userId}
                onChange={handleReportChange}
              >
                <option value="">Select publisher</option>
                {users
                  .filter(
                    (user, index, array) =>
                      array.findIndex((entry) => entry.id === user.id) === index
                  )
                  .map((user) => (
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
                value={reportForm.month}
                onChange={handleReportChange}
                placeholder="2026-05"
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

            <div className={styles.buttonRow}>
              <button className={styles.primaryButton} type="submit">
                {reportForm.reportId ? "Update report" : "Save report"}
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={resetReportForm}
              >
                Clear report form
              </button>
            </div>
          </form>
        </article>
      </div>

      <div className={styles.dataColumn}>
        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>Groups</span>
            <h2>Current groups</h2>
          </div>

          <div className={styles.groupList}>
            {groups.map((group) => (
              <div key={group.id} className={styles.groupItem}>
                <div>
                  <strong>{group.name}</strong>
                  <p>Overseer: {group.overseer}</p>
                </div>
                <span className={styles.badge}>{group.memberCount} members</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.kicker}>Records</span>
            <h2>All users</h2>
          </div>

          {message ? <div className={styles.message}>{message}</div> : null}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Status</th>
                  <th>Month</th>
                  <th>Hours</th>
                  <th>Studies</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={`${user.id}-${user.reportId || "none"}`}>
                    <td>{user.name}</td>
                    <td>{user.groupName}</td>
                    <td>{user.status}</td>
                    <td>{user.month || "-"}</td>
                    <td>{user.hours ?? "-"}</td>
                    <td>{user.bibleStudies ?? "-"}</td>
                    <td className={styles.actionsCell}>
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.textButton}
                        onClick={() =>
                          user.reportId ? handleEditReport(user) : handleAddReport(user)
                        }
                      >
                        {user.reportId ? "Edit report" : "Add report"}
                      </button>
                      <button
                        type="button"
                        className={styles.textButtonDanger}
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}

export default ReportingPage;
