ALTER TABLE service_reports
    DROP COLUMN pump_running,
    DROP COLUMN tank_level_before,
    DROP COLUMN tank_level_after,
    DROP COLUMN actual_rate;

ALTER TABLE service_visit_stops
    DROP COLUMN sample_collected;

ALTER TABLE service_visits
    ADD COLUMN name VARCHAR(255) AFTER tenant_id;
