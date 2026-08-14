-- Convert wells.pump_type from ENUM to VARCHAR so it stores the master name directly
ALTER TABLE wells MODIFY COLUMN pump_type VARCHAR(100) NOT NULL DEFAULT 'Rod Pump';

-- Pump types master table (per tenant)
CREATE TABLE IF NOT EXISTS pump_types (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id   CHAR(36)     NOT NULL,
    name        VARCHAR(100) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_system   TINYINT(1)   NOT NULL DEFAULT 0,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    created_by  CHAR(36),
    CONSTRAINT fk_pump_types_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Seed standard list for all existing tenants
INSERT INTO pump_types (id, tenant_id, name, sort_order, is_system, is_active, is_deleted, created_at, updated_at)
SELECT UUID(), t.id, pt.name, pt.sort_order, 1, 1, 0, NOW(6), NOW(6)
FROM tenants t
CROSS JOIN (
    SELECT 'Rod Pump'                        AS name, 1  AS sort_order UNION ALL
    SELECT 'ESP (Electric Submersible Pump)',          2               UNION ALL
    SELECT 'Gas Lift',                                3               UNION ALL
    SELECT 'Plunger Lift',                            4               UNION ALL
    SELECT 'Chemical Injector',                       5               UNION ALL
    SELECT 'Progressive Cavity Pump (PCP)',            6               UNION ALL
    SELECT 'Jet Pump',                                7               UNION ALL
    SELECT 'Hydraulic Pump',                          8               UNION ALL
    SELECT 'Natural Flow',                            9               UNION ALL
    SELECT 'None',                                    10
) pt
WHERE t.is_deleted = 0;
