ALTER TABLE treatment_program_lines CHANGE COLUMN rec_rate_per_day rec_rate DECIMAL(12,4) NOT NULL;
ALTER TABLE treatment_program_lines CHANGE COLUMN frequency method VARCHAR(20) NOT NULL;
ALTER TABLE treatment_program_lines ADD COLUMN schedule VARCHAR(20) NULL AFTER method;
