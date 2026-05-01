import { useEffect, useState } from "react";
import { deleteReportingUser, getGroups, getReportingUsers } from "../../api/reporting";
import styles from "./GroupsPage.module.css";

function ViewGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      const [groupsResponse, usersResponse] = await Promise.all([getGroups(), getReportingUsers()]);

      setGroups(groupsResponse.data.groups);
      setUsers(usersResponse.data.users);
    } catch (error) {
      setMessage("Failed to load group data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesGroup =
      selectedGroupId === "all" || String(user.groupId) === selectedGroupId;
    const matchesName = user.name
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());

    return matchesGroup && matchesName;
  });

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
    <section className={styles.page}>
      <article className={styles.card}>
        <div className={styles.headerRow}>
          <div>
            <p className={styles.kicker}>View Groups</p>
          
          </div>

          <div className={styles.filterControls}>
            <input
              className={styles.input}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by publisher name"
            />

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
