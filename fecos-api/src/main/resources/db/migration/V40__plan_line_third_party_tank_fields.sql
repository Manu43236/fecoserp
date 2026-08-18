ALTER TABLE treatment_plan_lines
    ADD COLUMN third_party_name VARCHAR(255) NULL,
    ADD COLUMN third_party_capacity_gallons DECIMAL(10,2) NULL,
    ADD COLUMN third_party_serial VARCHAR(100) NULL;
