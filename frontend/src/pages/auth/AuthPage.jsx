import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./AuthPage.module.css";

const initialRegisterState = {
  name: "",
  email: "",
  password: ""
};

const initialLoginState = {
  email: "",
  password: ""
};

function AuthPage() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [message, setMessage] = useState("");
  const isRegister = mode === "register";

  const nextRoute = location.state?.from || "/dashboard";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/auth/login");
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    try {
      await register(registerForm);
      navigate(nextRoute, { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    try {
      await login(loginForm);
      navigate(nextRoute, { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.brandPanel}>
          <p className={styles.kicker}>Authentication</p>
          <h1 className={styles.heading}>Smooth entry into the reporting workflow.</h1>
          <p className={styles.copy}>
            Session state is checked globally. Once a user signs in, protected
            routes open automatically and the profile area becomes available.
          </p>
          {message ? <div className={styles.message}>{message}</div> : null}
        </div>

        <div className={styles.stage}>
          <div
            className={
              isRegister ? `${styles.cardSwap} ${styles.cardSwapRegister}` : styles.cardSwap
            }
          >
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <button type="button" className={styles.backButton} onClick={handleBack}>
                  Back
                </button>
                <button
                  type="button"
                  className={styles.switchButton}
                  onClick={() => navigate("/auth/register")}
                >
                  Need an account?
                </button>
              </div>

              <h2 className={styles.cardTitle}>Login</h2>

              <form className={styles.form} onSubmit={handleLoginSubmit}>
                <label className={styles.label}>
                  Email
                  <input
                    className={styles.input}
                    name="email"
                    type="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    placeholder="jane@example.com"
                  />
                </label>

                <label className={styles.label}>
                  Password
                  <input
                    className={styles.input}
                    name="password"
                    type="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="Your password"
                  />
                </label>

                <button className={styles.submitButton} type="submit">
                  Enter dashboard
                </button>
              </form>
            </article>

            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <button type="button" className={styles.backButton} onClick={handleBack}>
                  Back
                </button>
                <button
                  type="button"
                  className={styles.switchButton}
                  onClick={() => navigate("/auth/login")}
                >
                  Have an account?
                </button>
              </div>

              <h2 className={styles.cardTitle}>Register</h2>

              <form className={styles.form} onSubmit={handleRegisterSubmit}>
                <label className={styles.label}>
                  Name
                  <input
                    className={styles.input}
                    name="name"
                    value={registerForm.name}
                    onChange={handleRegisterChange}
                    placeholder="Jane Doe"
                  />
                </label>

                <label className={styles.label}>
                  Email
                  <input
                    className={styles.input}
                    name="email"
                    type="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    placeholder="jane@example.com"
                  />
                </label>

                <label className={styles.label}>
                  Password
                  <input
                    className={styles.input}
                    name="password"
                    type="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    placeholder="Choose a secure password"
                  />
                </label>

                <button className={styles.submitButton} type="submit">
                  Create account
                </button>
              </form>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthPage;
