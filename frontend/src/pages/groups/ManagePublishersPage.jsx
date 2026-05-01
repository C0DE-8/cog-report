import { useEffect, useMemo, useState } from "react";
import {
  deleteReportingUser,
  getGroups,
  getReportingUsers,
  getStatuses,
  updateReportingUser
} from "../../api/reporting";
import styles from "./GroupsPage.module.css";

const initialUserForm = {
  id: "",
  groupId: "",
  statusId: "",
  name: ""
};

function ManagePublishersPage() {
  const [groups, setGroups] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [userForm, setUserForm] = useState(initialUserForm);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [groupsResponse, statusesResponse, usersResponse] = await Promise.all([
        getGroups(),
        getStatuses(),
        getReportingUsers()
      ]);

      setGroups(groupsResponse.data.groups || []);
      setStatuses(statusesResponse.data.statuses || []);
      setUsers(usersResponse.data.users || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load publisher data");
      setGroups([]);
      setStatuses([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const uniqueUsers = useMemo(() => {
    const map = new Map();

    users.forEach((user) => {
      if (!map.has(user.id)) {
        map.set(user.id, {
          id: user.id,
          name: user.name,
          status: user.status,
          statusId: user.statusId,
          groupId: user.groupId,
          groupName: user.groupName
        });
      }
    });

    return Array.from(map.values());
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    return uniqueUsers.filter((user) => {
      const matchesGroup =
        groupFilter === "all" || String(user.groupId) === String(groupFilter);
      const matchesSearch =
        !normalizedTerm ||
        `${user.name} ${user.groupName} ${user.status}`
          .toLowerCase()
          .includes(normalizedTerm);

      return matchesGroup && matchesSearch;
    });
  }, [groupFilter, searchTerm, uniqueUsers]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userForm.id) {
      setMessage("Select a publisher from the table first");
      return;
    }

    setIsSavingUser(true);

    try {
      const response = await updateReportingUser(userForm.id, {
        groupId: userForm.groupId,
        statusId: userForm.statusId,
        name: userForm.name
      });

      setMessage(response.data.message);
      await loadData();
      setUserForm(initialUserForm);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update publisher");
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteReportingUser(id);
      setMessage(response.data.message);
      await loadData();

      if (userForm.id === String(id)) {
        setUserForm(initialUserForm);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete publisher");
    }
  };

  const renderLoadingRows = () =>
    Array.from({ length: 5 }, (_, index) => (
      <tr key={`publisher-loading-${index}`}>
        <td colSpan="5" className={styles.loadingCell}>
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
            <p className={styles.kicker}>Manage Publishers</p>
            <h1 className={styles.heading}>Update all publishers</h1>
            <p className={styles.copy}>
              Search across every publisher, then update their name, status, or assigned group.
            </p>
          </div>

          <div className={styles.filterControls}>
            <input
              className={styles.input}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by publisher, group, or status"
            />

            <select
              className={styles.input}
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
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

        {message ? <p className={styles.message}>{message}</p> : null}

        <div className={styles.manageGrid}>
          <form className={styles.editorPanel} onSubmit={handleSubmit}>
            <div>
              <h2 className={styles.sectionTitle}>
                {userForm.id ? `Edit ${userForm.name}` : "Edit publisher"}
              </h2>
              <p className={styles.sectionCopy}>
                Select a publisher row below to update their profile.
              </p>
            </div>

            <label className={styles.label}>
              Name
              <input
                className={styles.input}
                value={userForm.name}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Publisher name"
              />
            </label>

            <label className={styles.label}>
              Status
              <select
                className={styles.input}
                value={userForm.statusId}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, statusId: event.target.value }))
                }
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
              Group
              <select
                className={styles.input}
                value={userForm.groupId}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, groupId: event.target.value }))
                }
              >
                <option value="">Select group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!userForm.id || isSavingUser}
            >
              {isSavingUser ? "Saving publisher..." : "Update publisher"}
            </button>
          </form>

          <div className={styles.editorPanel}>
            <h2 className={styles.sectionTitle}>Publisher summary</h2>
            <p className={styles.sectionCopy}>
              Search by name, group, or status. Use the group filter to narrow the list.
            </p>

            <div className={styles.editorHeader}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Visible publishers</span>
                <strong>{filteredUsers.length}</strong>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Total groups</span>
                <strong>{groups.length}</strong>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryLabel}>Statuses</span>
                <strong>{statuses.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Group</th>
                <th>Status</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? renderLoadingRows()
                : filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.groupName}</td>
                      <td>{user.status}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.textButton}
                          onClick={() =>
                            setUserForm({
                              id: String(user.id),
                              name: user.name,
                              statusId: String(user.statusId),
                              groupId: String(user.groupId)
                            })
                          }
                        >
                          Edit
                        </button>
                      </td>
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
              {!isLoading && filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.emptyCell}>
                    No publishers matched your search.
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

export default ManagePublishersPage;
