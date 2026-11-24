-- Per-tenant sequential, human-facing route number (#1, #2, …).
-- Adds the column, backfills existing routes in creation order per tenant,
-- then enforces uniqueness per tenant. Fully idempotent.

DROP PROCEDURE IF EXISTS fecos_v85_route_number;
DELIMITER $$
CREATE PROCEDURE fecos_v85_route_number()
BEGIN
    -- 1. Add column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = DATABASE() AND table_name = 'routes'
                     AND column_name = 'route_number') THEN
        ALTER TABLE routes ADD COLUMN route_number INT NULL;
    END IF;

    -- 2. Backfill any unnumbered rows, sequential per tenant by creation order
    UPDATE routes r
    JOIN (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn
        FROM routes
    ) x ON x.id = r.id
    SET r.route_number = x.rn
    WHERE r.route_number IS NULL;

    -- 3. Unique per tenant
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics
                   WHERE table_schema = DATABASE() AND table_name = 'routes'
                     AND index_name = 'uq_routes_tenant_number') THEN
        ALTER TABLE routes ADD CONSTRAINT uq_routes_tenant_number UNIQUE (tenant_id, route_number);
    END IF;
END$$
DELIMITER ;

CALL fecos_v85_route_number();
DROP PROCEDURE fecos_v85_route_number;
