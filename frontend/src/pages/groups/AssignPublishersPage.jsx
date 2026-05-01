import { useEffect, useState } from "react";
import {
  createReportingUser,
  getGroups,
  getStatuses,
  updateReportingUser
} from "../../api/reporting";
import styles from "./GroupsPage.module.css";

const initialUserForm = {
  groupId: "",
  statusId: "",
  name: ""
};

function AssignPublishersPage() {
  const [groups, setGroups] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [userForm, setUserForm] = useState(initialUserForm);
  const [editingUserId, setEditingUserId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [groupsResponse, statusesResponse] = await Promise.all([
          getGroups(),
          getStatuses()
        ]);

        setGroups(groupsResponse.data.groups);
        setStatuses(statusesResponse.data.statuses);
      } catch (error) {
        setMessage("Failed to load assignment data");
      }
    };

    loadData();
  }, []);

  const handleUserChange = (event) => {
    const { name, value } = event.target;
    setUserForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = editingUserId
        ? await updateReportingUser(editingUserId, userForm)
        : await createReportingUser(userForm);

      setMessage(response.data.message);
      setUserForm(initialUserForm);
      setEditingUserId(null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save publisher");
    }
  };

  return (
    <section className={styles.page}>
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
    </section>
  );
}

export default AssignPublishersPage;
