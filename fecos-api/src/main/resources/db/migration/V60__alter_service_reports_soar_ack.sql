ALTER TABLE service_reports
    ADD COLUMN soar_ack_by    CHAR(36)     AFTER soar_note,
    ADD COLUMN soar_ack_at    DATETIME(6)  AFTER soar_ack_by,
    ADD COLUMN soar_ack_note  TEXT         AFTER soar_ack_at;
