import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./ProfilePage.module.css";

function ProfilePage() {
  const { user, refreshProfile, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      password: ""
    });
  }, [user]);

  useEffect(() => {
    refreshProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await updateProfile(form);
      setMessage(response.data.message);
      setForm((current) => ({ ...current, password: "" }));
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <section className={styles.page}>
      <article className={styles.card}>
        <p className={styles.kicker}>Profile</p>
        <h2 className={styles.heading}>Manage your personal information</h2>
        <p className={styles.copy}>
          Update the account details used by your session. Leave password blank
          if you only want to change name or email.
        </p>

        {message ? <div className={styles.message}>{message}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Name
            <input
              className={styles.input}
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </label>

          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </label>

          <label className={styles.label}>
            New password
            <input
              className={styles.input}
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Optional"
            />
          </label>

          <button className={styles.primaryButton} type="submit">
            Save profile
          </button>
        </form>
      </article>
    </section>
  );
}

export default ProfilePage;
