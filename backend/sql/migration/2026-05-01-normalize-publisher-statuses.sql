CREATE TABLE IF NOT EXISTS publisher_statuses (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO publisher_statuses (id, name) VALUES
  (1, 'Pioneer'),
  (2, 'Aux Pioneer'),
  (3, 'Other');

ALTER TABLE report_users
  ADD COLUMN IF NOT EXISTS status_id INT NULL AFTER status;

UPDATE report_users ru
INNER JOIN publisher_statuses ps ON ps.name = ru.status
SET ru.status_id = ps.id
WHERE ru.status_id IS NULL;

ALTER TABLE report_users
  MODIFY COLUMN status_id INT NOT NULL;

ALTER TABLE report_users
  ADD INDEX IF NOT EXISTS idx_report_users_status_id (status_id);

ALTER TABLE report_users
  ADD CONSTRAINT fk_report_users_status
  FOREIGN KEY (status_id) REFERENCES publisher_statuses(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
