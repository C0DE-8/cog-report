import { useEffect, useMemo, useState } from "react";
import { getGroups, updateGroup } from "../../api/reporting";
import styles from "./GroupsPage.module.css";

const initialGroupForm = {
  name: "",
  overseer: ""
};

function ManageGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [groupForm, setGroupForm] = useState(initialGroupForm);
  const [message, setMessage] = useState("");
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const loadGroups = async (preserveGroupId = selectedGroupId) => {
    setIsLoadingGroups(true);

    try {
      const response = await getGroups();
      const nextGroups = response.data.groups || [];

      setGroups(nextGroups);

      const nextSelectedGroupId =
        preserveGroupId &&
        nextGroups.some((group) => String(group.id) === String(preserveGroupId))
          ? String(preserveGroupId)
          : nextGroups[0]
            ? String(nextGroups[0].id)
            : "";

      setSelectedGroupId(nextSelectedGroupId);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load groups");
      setGroups([]);
      setSelectedGroupId("");
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const selectedGroup = groups.find(
      (group) => String(group.id) === String(selectedGroupId)
    );

    if (selectedGroup) {
      setGroupForm({
        name: selectedGroup.name,
        overseer: selectedGroup.overseer
      });
    } else {
      setGroupForm(initialGroupForm);
    }
  }, [groups, selectedGroupId]);

  const filteredGroups = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (!normalizedTerm) {
      return groups;
    }

    return groups.filter((group) =>
      `${group.name} ${group.overseer}`.toLowerCase().includes(normalizedTerm)
    );
  }, [groups, searchTerm]);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === selectedGroupId) || null,
    [groups, selectedGroupId]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedGroupId) {
      return;
    }

    setIsSavingGroup(true);

    try {
      const response = await updateGroup(selectedGroupId, groupForm);
      setMessage(response.data.message);
      await loadGroups(selectedGroupId);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update group");
    } finally {
      setIsSavingGroup(false);
    }
  };

  return (
    <section className={styles.page}>
      <article className={styles.card}>
        <div className={styles.headerStack}>
          <div>
            <p className={styles.kicker}>Manage Groups</p>
            <h1 className={styles.heading}>Update group details</h1>
            <p className={styles.copy}>
              Search groups, select one, and update the name or overseer without leaving this page.
            </p>
          </div>

          <div className={styles.filterPanel}>
            <label className={styles.label}>
              Search groups
              <input
                className={styles.input}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by group or overseer"
              />
            </label>
          </div>
        </div>

        {message ? <p className={styles.message}>{message}</p> : null}

        {isLoadingGroups ? (
          <div className={styles.tabsShell} aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={`group-tab-shell-${index}`} className={styles.tabSkeleton} />
            ))}
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className={styles.tabsRow} role="tablist" aria-label="Manage groups">
            {filteredGroups.map((group) => {
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
                  <span className={styles.tabMeta}>
                    {group.overseer} · {group.memberCount} publishers
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyState}>No groups matched your search.</p>
        )}

        <div className={styles.manageGrid}>
          <form className={styles.editorPanel} onSubmit={handleSubmit}>
            <div>
              <h2 className={styles.sectionTitle}>
                {selectedGroup ? selectedGroup.name : "Select a group"}
              </h2>
              <p className={styles.sectionCopy}>
                {selectedGroup
                  ? "Change the group details below and save."
                  : "Select a group tab to start editing."}
              </p>
            </div>

            <label className={styles.label}>
              Group name
              <input
                className={styles.input}
                value={groupForm.name}
                onChange={(event) =>
                  setGroupForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Group name"
              />
            </label>

            <label className={styles.label}>
              Group overseer
              <input
                className={styles.input}
                value={groupForm.overseer}
                onChange={(event) =>
                  setGroupForm((current) => ({ ...current, overseer: event.target.value }))
                }
                placeholder="Overseer name"
              />
            </label>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!selectedGroupId || isSavingGroup}
            >
              {isSavingGroup ? "Saving group..." : "Update group"}
            </button>
          </form>

          <div className={styles.editorPanel}>
            <h2 className={styles.sectionTitle}>Group summary</h2>
            <p className={styles.sectionCopy}>
              Use the search box to narrow the list, then select a group tab to edit it.
            </p>

            {selectedGroup ? (
              <div className={styles.editorHeader}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Group</span>
                  <strong>{selectedGroup.name}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Overseer</span>
                  <strong>{selectedGroup.overseer}</strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>Publishers</span>
                  <strong>{selectedGroup.memberCount}</strong>
                </div>
              </div>
            ) : (
              <p className={styles.emptyState}>Select a group to view its summary.</p>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}

export default ManageGroupsPage;
