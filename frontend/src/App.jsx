import { useState } from "react";
import AuthPage from "./pages/auth/AuthPage";
import ReportingPage from "./pages/reporting/ReportingPage";
import styles from "./App.module.css";

const sections = [
  { key: "auth", label: "Auth" },
  { key: "reporting", label: "Reporting" }
];

function App() {
  const [activeSection, setActiveSection] = useState("auth");

  return (
    <div className={styles.appShell}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Cog Report</p>
          <h1 className={styles.title}>Group-first reporting dashboard</h1>
          <p className={styles.subtitle}>
            Manage authentication, groups, publishers, and monthly reports from
            one frontend.
          </p>
        </div>

        <nav className={styles.nav}>
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={
                activeSection === section.key
                  ? `${styles.navButton} ${styles.navButtonActive}`
                  : styles.navButton
              }
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.pageArea}>
        {activeSection === "auth" ? <AuthPage /> : <ReportingPage />}
      </main>
    </div>
  );
}

export default App;
