ALTER TABLE monthly_reports
  ADD INDEX IF NOT EXISTS idx_monthly_reports_report_month (report_month);

ALTER TABLE monthly_report_entries
  ADD INDEX IF NOT EXISTS idx_monthly_report_entries_report_created
    (monthly_report_id, created_at);
