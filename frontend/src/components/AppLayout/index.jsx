import { memo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./AppLayout.module.css";

const navigationItems = [
  { to: "/dashboard", label: "Overview" },
  { type: "label", label: "Groups" },
  { to: "/groups/create", label: "Create Group" },
  { to: "/groups/view", label: "View Groups" },
  { to: "/groups/assign", label: "Assign Publishers" },
  { to: "/groups/reports", label: "Add Report" },
  { to: "/profile", label: "Profile" }
];

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarInner}>
          <div className={styles.brand}>
            <p className={styles.eyebrow}>Cog Report</p>
            <h1 className={styles.title}>Field service dashboard</h1>
            <p className={styles.copy}>
              Track groups, publishers, and monthly activity in one place.
            </p>
          </div>

          <nav className={styles.nav}>
            {navigationItems.map((item) =>
              item.type === "label" ? (
                <div key={item.label} className={styles.menuLabel}>
                  {item.label}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.linkActive}` : styles.link
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <div className={styles.footer}>
            <div className={styles.userCard}>
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className={styles.content}>
        <div className={styles.contentInner}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default memo(AppLayout);
