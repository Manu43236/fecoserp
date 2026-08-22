SET @s1 = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_reports' AND COLUMN_NAME = 'sample_photo_url') > 0,
    'SELECT 1',
    'ALTER TABLE service_reports ADD COLUMN sample_photo_url VARCHAR(500)'
));
PREPARE stmt FROM @s1; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @s2 = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_report_treatment_lines' AND COLUMN_NAME = 'product_name') > 0,
    'SELECT 1',
    'ALTER TABLE service_report_treatment_lines ADD COLUMN product_name VARCHAR(255)'
));
PREPARE stmt FROM @s2; EXECUTE stmt; DEALLOCATE PREPARE stmt;
