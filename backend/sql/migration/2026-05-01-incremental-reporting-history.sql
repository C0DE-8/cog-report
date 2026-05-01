ALTER TABLE monthly_reports
  ADD COLUMN IF NOT EXISTS is_present TINYINT(1) NOT NULL DEFAULT 0 AFTER report_month;

CREATE TABLE IF NOT EXISTS monthly_report_entries (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  monthly_report_id INT NOT NULL,
  hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  bible_studies INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_monthly_report_entries_report
    FOREIGN KEY (monthly_report_id) REFERENCES monthly_reports(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

INSERT INTO monthly_report_entries (monthly_report_id, hours, bible_studies, created_at)
SELECT
  mr.id,
  mr.hours,
  mr.bible_studies,
  mr.created_at
FROM monthly_reports mr
WHERE (mr.hours > 0 OR mr.bible_studies > 0)
  AND NOT EXISTS (
    SELECT 1
    FROM monthly_report_entries mre
    WHERE mre.monthly_report_id = mr.id
  );

UPDATE monthly_reports
SET is_present = 1
WHERE hours > 0 OR bible_studies > 0;
