ALTER TABLE pumps
    ADD COLUMN updated_at  TIMESTAMP NULL,
    ADD COLUMN created_by  CHAR(36)  NULL;

ALTER TABLE pump_maintenance_logs
    ADD COLUMN updated_at  TIMESTAMP NULL,
    ADD COLUMN created_by  CHAR(36)  NULL;
