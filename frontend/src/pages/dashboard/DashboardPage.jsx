import { useEffect, useState } from "react";
import { getReportingUsers } from "../../api/reporting";
import styles from "./DashboardPage.module.css";

const categoryOrder = ["Pioneer", "Aux Pioneer", "Other"];

function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const loadUsers = async () => {
    try {
      const response = await getReportingUsers();
      setUsers(response.data.users);
    } catch (error) {
      setMessage("Failed to load reporting overview");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const summary = users.reduce(
    (accumulator, user) => {
      accumulator.hours += Number(user.hours || 0);
      accumulator.bibleStudies += Number(user.bibleStudies || 0);
      return accumulator;
    },
    { hours: 0, bibleStudies: 0 }
  );

  const groupedUsers = categoryOrder.map((category) => ({
    category,
    users: users.filter((user) => user.status === category)
  }));

  const visibleSections =
    activeCategory === "All"
      ? groupedUsers
      : groupedUsers.filter((entry) => entry.category === activeCategory);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Overview</p>
          <h2 className={styles.heading}>Ministry summary across all categories</h2>
          <p className={styles.copy}>
            Keep this page focused on totals and category health. Detailed report
            entry now lives in the group management view.
          </p>
        </div>

        <div className={styles.summaryGrid}>
          <article className={styles.metricCard}>
            <span>Total Hours</span>
            <strong>{summary.hours.toFixed(1)}</strong>
          </article>
          <article className={styles.metricCard}>
            <span>Total Bible Studies</span>
            <strong>{summary.bibleStudies}</strong>
          </article>
        </div>
      </header>

      <div className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.filterRow}>
            {["All", ...categoryOrder].map((category) => (
              <button
                key={category}
                type="button"
                className={
                  activeCategory === category
                    ? `${styles.filterButton} ${styles.filterButtonActive}`
                    : styles.filterButton
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {message ? <div className={styles.message}>{message}</div> : null}

          <div className={styles.categoryStack}>
            {visibleSections.map((section) => (
              <div key={section.category} className={styles.categorySection}>
                <div className={styles.panelHeader}>
                  <h3>{section.category}</h3>
                  <span>{section.users.length} assigned publishers</span>
                </div>

                <div className={styles.listGrid}>
                  {section.users.map((user) => (
                    <article
                      key={`${section.category}-${user.id}-${user.reportId || "none"}`}
                      className={styles.publisherCard}
                    >
                      <strong>{user.name}</strong>
                      <span>{user.groupName}</span>
                    </article>
                  ))}
                  {section.users.length === 0 ? (
                    <div className={styles.emptyState}>
                      No publishers in this category yet.
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className={styles.sideColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Overview notes</h3>
            </div>
            <p className={styles.sideNote}>
              Use `Groups > View Groups` to pick a group, see everyone assigned to
              it, and add or edit monthly reports with the month picker.
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default DashboardPage;
