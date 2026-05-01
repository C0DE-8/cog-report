import { memo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./AppLayout.module.css";

const primaryNavigationItems = [
  { to: "/dashboard", label: "Overview" }
];

const reportNavigationItems = [
  { to: "/reports", label: "Add Report" },
  { to: "/reports/view", label: "View Report" }
];

const groupNavigationItems = [
  { to: "/groups/create", label: "Create Group" },
  { to: "/groups/view", label: "View Groups" },
  { to: "/groups/manage", label: "Manage Groups" },
  { to: "/groups/manage-publishers", label: "Manage Publishers" },
  { to: "/groups/assign", label: "Assign Publishers" }
];


function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isGroupRoute = location.pathname.startsWith("/groups");
  const isReportRoute = location.pathname.startsWith("/reports");
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

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
            <h1 className={styles.title}>Field service </h1>
          </div>

          <nav className={styles.nav}>
            {primaryNavigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.linkActive}` : styles.link
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className={styles.menuGroup}>
              <button
                type="button"
                className={
                  isReportRoute || isReportsOpen
                    ? `${styles.accordionToggle} ${styles.accordionToggleActive}`
                    : styles.accordionToggle
                }
                onClick={() => setIsReportsOpen((current) => !current)}
                aria-expanded={isReportsOpen}
                aria-controls="reports-navigation"
              >
                <span>Reports</span>
                <span
                  className={
                    isReportsOpen ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron
                  }
                >
                  ▾
                </span>
              </button>

              <div
                id="reports-navigation"
                className={
                  isReportsOpen
                    ? `${styles.subnav} ${styles.subnavOpen}`
                    : styles.subnav
                }
              >
                {reportNavigationItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? `${styles.subLink} ${styles.subLinkActive}` : styles.subLink
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className={styles.menuGroup}>
              <button
                type="button"
                className={
                  isGroupRoute || isGroupsOpen
                    ? `${styles.accordionToggle} ${styles.accordionToggleActive}`
                    : styles.accordionToggle
                }
                onClick={() => setIsGroupsOpen((current) => !current)}
                aria-expanded={isGroupsOpen}
                aria-controls="groups-navigation"
              >
                <span>Groups</span>
                <span
                  className={
                    isGroupsOpen ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron
                  }
                >
                  ▾
                </span>
              </button>

              <div
                id="groups-navigation"
                className={
                  isGroupsOpen
                    ? `${styles.subnav} ${styles.subnavOpen}`
                    : styles.subnav
                }
              >
                {groupNavigationItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive ? `${styles.subLink} ${styles.subLinkActive}` : styles.subLink
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

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
