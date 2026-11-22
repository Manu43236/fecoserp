-- Account Rep coverage: an AR is responsible for a scoped set of clients/leases/wells.
-- `clients.account_rep_id` already exists (V7); add the same nullable column to leases + wells.
-- A well's effective AR = well's own → else its lease's → else its client's (most-specific wins).
-- Stored compactly: whole-client sets only the client row, whole-lease only the lease row, etc.
--
-- Idempotent on purpose: an earlier build of this migration contained a syntax error that
-- half-applied on some environments (columns added, indexes not). Guarding every object so a
-- re-run completes cleanly whatever state the table is in.

DROP PROCEDURE IF EXISTS fecos_v83_coverage;
DELIMITER $$
CREATE PROCEDURE fecos_v83_coverage()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE() AND table_name = 'leases' AND column_name = 'account_rep_id') THEN
        ALTER TABLE leases
            ADD COLUMN account_rep_id CHAR(36) NULL,
            ADD CONSTRAINT fk_leases_acct_rep FOREIGN KEY (account_rep_id) REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE() AND table_name = 'wells' AND column_name = 'account_rep_id') THEN
        ALTER TABLE wells
            ADD COLUMN account_rep_id CHAR(36) NULL,
            ADD CONSTRAINT fk_wells_acct_rep FOREIGN KEY (account_rep_id) REFERENCES users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics
                   WHERE table_schema = DATABASE() AND table_name = 'leases' AND index_name = 'idx_leases_account_rep') THEN
        CREATE INDEX idx_leases_account_rep ON leases (account_rep_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics
                   WHERE table_schema = DATABASE() AND table_name = 'wells' AND index_name = 'idx_wells_account_rep') THEN
        CREATE INDEX idx_wells_account_rep ON wells (account_rep_id);
    END IF;
END$$
DELIMITER ;

CALL fecos_v83_coverage();
DROP PROCEDURE fecos_v83_coverage;
