ALTER TABLE treatment_plans
    ADD COLUMN paused_at DATETIME(6) NULL,
    ADD COLUMN resumed_at DATETIME(6) NULL;
