ALTER TABLE treatment_plan_lines
    ADD COLUMN rec_rate_previous      DECIMAL(12,4) AFTER rec_rate,
    ADD COLUMN rec_rate_updated_by    CHAR(36)      AFTER rec_rate_previous,
    ADD COLUMN rec_rate_updated_at    DATETIME(6)   AFTER rec_rate_updated_by;
