import { useEffect, useMemo, useState } from "react";
import { getGroups, getReportingUsers } from "../../api/reporting";
import styles from "./GroupsPage.module.css";

function ViewGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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
        setSelectedGroupId((currentValue) => {
          if (
            currentValue &&
            nextGroups.some((group) => String(group.id) === currentValue)
          ) {
            return currentValue;
          }

          return nextGroups[0] ? String(nextGroups[0].id) : "";
        });
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

  useEffect(() => {
    if (!selectedGroupId) {
      setUsers([]);
      return;
    }

    let isActive = true;

    async function loadUsers() {
      setIsLoadingUsers(true);
      setMessage("");

      try {
        const response = await getReportingUsers({ groupId: selectedGroupId });

        if (isActive) {
          setUsers(response.data.users || []);
        }
      } catch (error) {
        if (isActive) {
          setUsers([]);
          setMessage(error.response?.data?.message || "Failed to load publishers");
        }
      } finally {
        if (isActive) {
          setIsLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      isActive = false;
    };
  }, [selectedGroupId]);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const filteredUsers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    const map = new Map();

    users.forEach((user) => {
      if (!map.has(user.id)) {
        map.set(user.id, user);
      }
    });

    const uniqueUsers = Array.from(map.values());

    if (!normalizedTerm) {
      return uniqueUsers;
    }

    return uniqueUsers.filter((user) =>
      user.name.toLowerCase().includes(normalizedTerm)
    );
  }, [searchTerm, users]);

  const renderLoadingRows = () =>
    Array.from({ length: 4 }, (_, index) => (
      <tr key={`loading-${index}`}>
        <td colSpan="3" className={styles.loadingCell}>
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
            <p className={styles.kicker}>View Groups</p>
            <h1 className={styles.heading}>Browse publishers by group</h1>
            <p className={styles.copy}>
              Switch groups to review assigned publishers without opening the management tools.
            </p>
          </div>

          <div className={styles.filterPanel}>
            <label className={styles.label}>
              Search by publisher name
              <input
                className={styles.input}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Start typing a name"
              />
            </label>
          </div>
        </div>

        {message ? <p className={styles.message}>{message}</p> : null}

        {isLoadingGroups ? (
          <div className={styles.tabsShell} aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={`tab-shell-${index}`} className={styles.tabSkeleton} />
            ))}
          </div>
        ) : groups.length > 0 ? (
          <div className={styles.tabsRow} role="tablist" aria-label="Groups">
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

        <div className={isLoadingUsers ? styles.contentLoading : styles.contentReady}>
          <div className={styles.groupSummary}>
            <div>
              <h2 className={styles.sectionTitle}>
                {selectedGroup ? selectedGroup.name : "Select a group"}
              </h2>
              <p className={styles.sectionCopy}>
                {selectedGroup
                  ? `${selectedGroup.overseer} oversees this group.`
                  : "Choose a group tab to load its publishers."}
              </p>
            </div>

            {selectedGroup ? (
              <p className={styles.groupMetric}>
                {filteredUsers.length} publisher{filteredUsers.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUsers
                  ? renderLoadingRows()
                  : filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.groupName}</td>
                        <td>{user.status}</td>
                      </tr>
                    ))}
                {!isLoadingUsers && filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={styles.emptyCell}>
                      {selectedGroup
                        ? "No publishers matched this group and search."
                        : "Choose a group to view assigned publishers."}
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

export default ViewGroupsPage;
