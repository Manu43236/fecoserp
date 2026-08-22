ALTER TABLE service_reports
    ADD COLUMN performed_at       DATETIME(6)   AFTER submitted_at,
    ADD COLUMN gps_lat            DECIMAL(10,7) AFTER performed_at,
    ADD COLUMN gps_lng            DECIMAL(10,7) AFTER gps_lat,
    ADD COLUMN gps_captured_at    DATETIME(6)   AFTER gps_lng,
    ADD COLUMN photo_url          VARCHAR(500)  AFTER gps_captured_at,
    ADD COLUMN photo_captured_at  DATETIME(6)   AFTER photo_url,
    ADD COLUMN soar_note          TEXT          AFTER photo_captured_at,
    ADD COLUMN sample_type        VARCHAR(50)   AFTER soar_note,
    ADD COLUMN sample_notes       TEXT          AFTER sample_type,
    ADD COLUMN signature_url      VARCHAR(500)  AFTER sample_notes,
    ADD COLUMN signer_name        VARCHAR(100)  AFTER signature_url,
    ADD COLUMN signed_at          DATETIME(6)   AFTER signer_name;
