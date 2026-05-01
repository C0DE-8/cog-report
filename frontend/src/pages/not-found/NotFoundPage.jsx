import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./NotFoundPage.module.css";

function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.kicker}>404</p>
        <h1 className={styles.title}>This page went missing.</h1>
        <p className={styles.copy}>
          The route you opened does not exist or may have been moved to a different
          part of the reporting workspace.
        </p>

        <div className={styles.actions}>
          <Link
            to={isAuthenticated ? "/dashboard" : "/auth/login"}
            className={styles.primaryAction}
          >
            {isAuthenticated ? "Return to dashboard" : "Go to login"}
          </Link>
          <Link to="/" className={styles.secondaryAction}>
            Open home route
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFoundPage;
