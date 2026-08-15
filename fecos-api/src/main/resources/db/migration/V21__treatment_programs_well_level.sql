ALTER TABLE treatment_programs DROP FOREIGN KEY fk_tp_lease;

ALTER TABLE treatment_programs DROP COLUMN lease_id;

ALTER TABLE treatment_programs ADD COLUMN well_id CHAR(36) NULL AFTER tenant_id;
