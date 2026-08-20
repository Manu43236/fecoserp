ALTER TABLE pump_maintenance_logs
    ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0;
