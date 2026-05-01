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

  const filteredUsers =
    activeCategory === "All"
      ? users
      : users.filter((user) => user.status === activeCategory);

  const filteredSummary = filteredUsers.reduce(
    (accumulator, user) => {
      accumulator.hours += Number(user.hours || 0);
      accumulator.bibleStudies += Number(user.bibleStudies || 0);
      return accumulator;
    },
    { hours: 0, bibleStudies: 0 }
  );

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Overview</p>
          <h2 className={styles.heading}>High-level ministry totals</h2>
          <p className={styles.copy}>
            This page stays focused on aggregate performance only. Detailed data
            entry and publisher management live in the group views.
          </p>
        </div>

        <div className={styles.summaryGrid}>
          <article className={styles.metricCard}>
            <span>Organization Hours</span>
            <strong>{summary.hours.toFixed(1)}</strong>
          </article>
          <article className={styles.metricCard}>
            <span>Organization Bible Studies</span>
            <strong>{summary.bibleStudies}</strong>
          </article>
        </div>
      </header>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Filtered totals</h3>
            <span>
              {activeCategory === "All"
                ? "All publishers combined"
                : `${activeCategory} only`}
            </span>
          </div>
        </div>

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

        <div className={styles.filteredGrid}>
          <article className={styles.metricCard}>
            <span>
              {activeCategory === "All" ? "Total Hours" : `${activeCategory} Hours`}
            </span>
            <strong>{filteredSummary.hours.toFixed(1)}</strong>
          </article>

          <article className={styles.metricCard}>
            <span>
              {activeCategory === "All"
                ? "Total Bible Studies"
                : `${activeCategory} Bible Studies`}
            </span>
            <strong>{filteredSummary.bibleStudies}</strong>
          </article>
        </div>
      </article>
    </section>
  );
}

export default DashboardPage;
