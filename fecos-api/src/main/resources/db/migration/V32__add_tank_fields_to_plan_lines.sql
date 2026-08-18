ALTER TABLE treatment_plan_lines
    ADD COLUMN tank_owner             ENUM('ENDURA','THIRD_PARTY') NULL,
    ADD COLUMN tank_level_pct         DECIMAL(5,2)                 NULL,
    ADD COLUMN tank_level_checked_at  TIMESTAMP                    NULL,
    ADD COLUMN tank_id                CHAR(36)                     NULL;
