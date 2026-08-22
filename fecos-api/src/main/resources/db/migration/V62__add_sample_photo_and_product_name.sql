ALTER TABLE service_reports ADD COLUMN IF NOT EXISTS sample_photo_url VARCHAR(500);
ALTER TABLE service_report_treatment_lines ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
