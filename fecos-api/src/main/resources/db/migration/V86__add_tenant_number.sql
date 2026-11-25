-- Adds a short human-readable number to each tenant (e.g. "01", "02").
-- Used to build module reference numbers: TK-01-7, R-01-12, etc.
-- Fully idempotent.

DROP PROCEDURE IF EXISTS fecos_v86_tenant_number;
DELIMITER $$
CREATE PROCEDURE fecos_v86_tenant_number()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE() AND table_name = 'tenants'
                     AND column_name = 'tenant_number') THEN
        ALTER TABLE tenants ADD COLUMN tenant_number VARCHAR(5) NULL;
    END IF;

    -- Assign sequential numbers to existing tenants (by creation order)
    UPDATE tenants t
    JOIN (
        SELECT id, LPAD(ROW_NUMBER() OVER (ORDER BY created_at, id), 2, '0') AS rn
        FROM tenants
        WHERE is_deleted = 0
    ) x ON x.id = t.id
    SET t.tenant_number = x.rn
    WHERE t.tenant_number IS NULL;
END$$
DELIMITER ;

CALL fecos_v86_tenant_number();
DROP PROCEDURE IF EXISTS fecos_v86_tenant_number;
