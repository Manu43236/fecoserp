-- Older databases may contain a legacy unit column; fresh schemas do not.
SET @has_plan_line_unit = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'treatment_plan_lines'
      AND column_name = 'unit'
);
SET @plan_line_unit_sql = IF(
    @has_plan_line_unit > 0,
    'ALTER TABLE treatment_plan_lines MODIFY COLUMN unit VARCHAR(50) NULL',
    'SELECT 1'
);
PREPARE plan_line_unit_stmt FROM @plan_line_unit_sql;
EXECUTE plan_line_unit_stmt;
DEALLOCATE PREPARE plan_line_unit_stmt;
