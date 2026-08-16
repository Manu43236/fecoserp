-- Lab result approval workflow + treatment plan supersede support

ALTER TABLE lab_results
    ADD COLUMN approval_status   ENUM('PENDING_REVIEW','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING_REVIEW',
    ADD COLUMN approved_by_id    CHAR(36)  NULL,
    ADD COLUMN approved_at       TIMESTAMP NULL,
    ADD COLUMN approval_notes    TEXT      NULL,
    ADD COLUMN requires_treatment_change TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE treatment_plans
    MODIFY COLUMN status ENUM('DRAFT','ACTIVE','INACTIVE','SUPERSEDED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN superseded_at TIMESTAMP NULL;
