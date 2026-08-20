ALTER TABLE treatment_plan_lines MODIFY COLUMN tank_owner ENUM('ENDURA','THIRD_PARTY','OWN') NULL;
UPDATE treatment_plan_lines SET tank_owner = 'OWN' WHERE tank_owner = 'ENDURA';
ALTER TABLE treatment_plan_lines MODIFY COLUMN tank_owner ENUM('OWN','THIRD_PARTY') NULL;
