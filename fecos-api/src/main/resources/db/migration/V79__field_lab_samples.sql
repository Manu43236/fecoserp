-- Field-to-Lab sample handoff: let a Service Tech's collected sample become a lab record.

-- 1. Custody code = the bottle label minted on the device (e.g. LS-WELX1-PW-18/01).
--    NULL for lab-created / pre-existing samples.
ALTER TABLE lab_samples
    ADD COLUMN custody_code VARCHAR(40) NULL AFTER sample_number;

-- 2. received_at is only known when the physical bottle reaches the bench.
--    Field-created (COLLECTED) samples have no receipt time yet.
ALTER TABLE lab_samples
    MODIFY COLUMN received_at DATETIME NULL;

-- 3. New COLLECTED state: exists digitally, in transit, bottle not yet received.
--    Default stays RECEIVED so lab-created samples are unaffected.
ALTER TABLE lab_samples
    MODIFY COLUMN status ENUM('COLLECTED','RECEIVED','IN_PROGRESS','COMPLETED')
        NOT NULL DEFAULT 'RECEIVED';

-- 4. Duplicate-guard for the rare two-techs/same-well/same-type/same-day-offline clash.
--    MySQL treats rows with a NULL part as non-duplicate, so legacy/lab-created rows
--    (custody_code NULL) are exempt; only a repeated non-null code is rejected.
--    Also serves as the (tenant_id, custody_code) lookup index for reconciliation search.
CREATE UNIQUE INDEX uq_lab_samples_custody
    ON lab_samples (tenant_id, custody_code);
