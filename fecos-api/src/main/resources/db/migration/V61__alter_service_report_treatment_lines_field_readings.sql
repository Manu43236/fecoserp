ALTER TABLE service_report_treatment_lines
    ADD COLUMN tank_level_pct    DECIMAL(5,2) AFTER applied,
    ADD COLUMN deviation_reason  TEXT         AFTER tank_level_pct,
    ADD COLUMN quantity_applied  DECIMAL(10,4) AFTER deviation_reason,
    ADD COLUMN pump_down_reason  TEXT         AFTER quantity_applied;
