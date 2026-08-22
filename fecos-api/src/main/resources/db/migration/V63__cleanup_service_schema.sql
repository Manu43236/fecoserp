-- Drop redundant top-level report fields superseded by service_report_treatment_lines (V58)
ALTER TABLE service_reports
    DROP COLUMN IF EXISTS pump_running,
    DROP COLUMN IF EXISTS tank_level_before,
    DROP COLUMN IF EXISTS tank_level_after,
    DROP COLUMN IF EXISTS actual_rate;

-- Drop redundant sample flag — sample data lives in service_reports columns
ALTER TABLE service_visit_stops
    DROP COLUMN IF EXISTS sample_collected;

-- Add name to schedules so mobile can display a meaningful label
ALTER TABLE service_visits
    ADD COLUMN name VARCHAR(255) AFTER tenant_id;
