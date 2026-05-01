import { useEffect, useState } from "react";
import {
  createUserReport,
  createReportingUser,
  deleteReportingUser,
  getGroups,
  getReportingUsers,
  getStatuses,
  updateReportingUser,
  updateUserReport
} from "../../api/reporting";
import styles from "./GroupsPage.module.css";

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

function ViewGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [userForm, setUserForm] = useState(initialUserForm);
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [message, setMessage] = useState("");

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
      setMessage("Failed to load group data");
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

  useEffect(() => {
    if (selectedGroupId !== "all") {
      setUserForm((current) => ({ ...current, groupId: selectedGroupId }));
    }
  }, [selectedGroupId]);

  const handleUserChange = (event) => {
    const { name, value } = event.target;
    setUserForm((current) => ({ ...current, [name]: value }));
  };

  const handleReportChange = (event) => {
    const { name, value } = event.target;
    setReportForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingUserId) {
        const response = await updateReportingUser(editingUserId, userForm);
        setMessage(response.data.message);
      } else {
        const response = await createReportingUser(userForm);
        setMessage(response.data.message);
      }

      setUserForm(initialUserForm);
      setEditingUserId(null);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save publisher");
    }
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setUserForm({
      groupId: String(user.groupId),
      statusId: String(user.statusId),
      name: user.name
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

  const handleEditReport = (user) => {
    setReportForm({
      userId: String(user.id),
      reportId: user.reportId,
      month: user.month || "",
      hours: user.hours ?? "",
      bibleStudies: user.bibleStudies ?? ""
    });
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        month: reportForm.month,
        hours: Number(reportForm.hours || 0),
        bibleStudies: Number(reportForm.bibleStudies || 0)
      };

      if (reportForm.reportId) {
        const response = await updateUserReport(reportForm.reportId, payload);
        setMessage(response.data.message);
      } else {
        const response = await createUserReport(reportForm.userId, payload);
        setMessage(response.data.message);
      }

      setReportForm(initialReportForm);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save report");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteReportingUser(id);
      setMessage(response.data.message);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete publisher");
    }
  };

  return (
    <section className={styles.pageGrid}>
      <div className={styles.sideStack}>
        <article className={styles.card}>
          <p className={styles.kicker}>Assign Publishers</p>
          <h2 className={styles.heading}>Add users to groups and manage their status</h2>

          {message ? <div className={styles.message}>{message}</div> : null}

          <form className={styles.form} onSubmit={handleSubmit}>
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

            <button className={styles.primaryButton} type="submit">
              {editingUserId ? "Update publisher" : "Assign to group"}
            </button>
          </form>
        </article>

        <article className={styles.card}>
          <p className={styles.kicker}>Add Report</p>
          <h2 className={styles.heading}>
            {reportForm.reportId ? "Update monthly report" : "Add monthly report"}
          </h2>

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
      </div>

      <article className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.kicker}>View Groups</p>
            <h2 className={styles.heading}>Browse by assigned group</h2>
            <p className={styles.copy}>
              Selecting a group immediately shows every publisher assigned to it.
            </p>
          </div>

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
                      onClick={() => handleEdit(user)}
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
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyCell}>
                    No publishers are assigned to this group yet.
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

export default ViewGroupsPage;
