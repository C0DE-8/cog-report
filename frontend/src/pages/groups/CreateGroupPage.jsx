import { useState } from "react";
import { createGroup } from "../../api/reporting";
import styles from "./GroupsPage.module.css";

const initialForm = {
  name: "",
  overseer: ""
};

function CreateGroupPage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await createGroup(form);
      setMessage(response.data.message);
      setForm(initialForm);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to create group");
    }
  };

  return (
    <section className={styles.page}>
      <article className={styles.card}>
        <p className={styles.kicker}>Groups</p>
        <h2 className={styles.heading}>Create a new field service group</h2>
        <p className={styles.copy}>
          Group-first structure stays enforced here before publishers are assigned.
        </p>

        {message ? <div className={styles.message}>{message}</div> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Group name
            <input
              className={styles.input}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="North Group"
            />
          </label>

          <label className={styles.label}>
            Group overseer
            <input
              className={styles.input}
              name="overseer"
              value={form.overseer}
              onChange={handleChange}
              placeholder="Overseer name"
            />
          </label>

          <button className={styles.primaryButton} type="submit">
            Save group
          </button>
        </form>
      </article>
    </section>
  );
}

export default CreateGroupPage;
