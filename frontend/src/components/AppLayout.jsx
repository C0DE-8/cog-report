import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./AppLayout.module.css";

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
        <div className={styles.brand}>
          <p className={styles.eyebrow}>Cog Report</p>
          <h1 className={styles.title}>Field service dashboard</h1>
          <p className={styles.copy}>
            Track groups, publishers, and monthly activity in one place.
          </p>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            Overview
          </NavLink>

          <div className={styles.menuLabel}>Groups</div>

          <NavLink
            to="/groups/create"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            Create Group
          </NavLink>

          <NavLink
            to="/groups/view"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            View Groups
          </NavLink>

          <NavLink
            to="/groups/assign"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            Assign Publishers
          </NavLink>

          <NavLink
            to="/groups/reports"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            Add Report
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
          >
            Profile
          </NavLink>
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
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
