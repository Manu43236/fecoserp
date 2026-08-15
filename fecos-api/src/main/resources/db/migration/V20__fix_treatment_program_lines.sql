ALTER TABLE treatment_program_lines
    CHANGE COLUMN rec_rate rec_rate_per_day DECIMAL(12,4) NOT NULL;

ALTER TABLE treatment_programs
    ADD COLUMN start_date DATE NULL AFTER notes;
