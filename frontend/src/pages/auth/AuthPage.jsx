import { useState } from "react";
import { loginUser, registerUser } from "../../api/auth";
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
  const [registerForm, setRegisterForm] = useState(initialRegisterState);
  const [loginForm, setLoginForm] = useState(initialLoginState);
  const [message, setMessage] = useState("");
  const [activeCard, setActiveCard] = useState("register");

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
      const response = await registerUser(registerForm);
      setMessage(response.data.message);
      setRegisterForm(initialRegisterState);
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await loginUser(loginForm);
      setMessage(`${response.data.message}: ${response.data.user.name}`);
      setLoginForm(initialLoginState);
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <section className={styles.layout}>
      <div className={styles.infoPanel}>
        <span className={styles.kicker}>Authentication</span>
        <h2 className={styles.heading}>Keep auth isolated in its own page folder.</h2>
        <p className={styles.copy}>
          This page talks only to the auth API module. The backend routes stay
          mirrored in the frontend API layer so feature boundaries remain clear.
        </p>
        {message ? <div className={styles.message}>{message}</div> : null}
      </div>

      <div className={styles.formGrid}>
        <article
          className={
            activeCard === "register"
              ? `${styles.card} ${styles.cardActive}`
              : styles.card
          }
        >
          <button
            type="button"
            className={styles.cardToggle}
            onClick={() => setActiveCard("register")}
          >
            Create account
          </button>

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
                placeholder="Minimum secure password"
              />
            </label>

            <button className={styles.submitButton} type="submit">
              Register
            </button>
          </form>
        </article>

        <article
          className={
            activeCard === "login"
              ? `${styles.card} ${styles.cardActive}`
              : styles.card
          }
        >
          <button
            type="button"
            className={styles.cardToggle}
            onClick={() => setActiveCard("login")}
          >
            Sign in
          </button>

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
              Login
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}

export default AuthPage;
