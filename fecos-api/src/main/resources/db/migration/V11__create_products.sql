-- Product categories master (per tenant)
CREATE TABLE IF NOT EXISTS product_categories (
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
    CONSTRAINT fk_product_categories_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Product units master (per tenant)
CREATE TABLE IF NOT EXISTS product_units (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id   CHAR(36)     NOT NULL,
    name        VARCHAR(50)  NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    is_system   TINYINT(1)   NOT NULL DEFAULT 0,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    created_by  CHAR(36),
    CONSTRAINT fk_product_units_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id              CHAR(36)       NOT NULL PRIMARY KEY,
    tenant_id       CHAR(36)       NOT NULL,
    name            VARCHAR(150)   NOT NULL,
    product_code    VARCHAR(50),
    category        VARCHAR(100)   NOT NULL,
    unit            VARCHAR(50)    NOT NULL,
    description     TEXT,
    price_per_unit  DECIMAL(10, 4),
    is_active       TINYINT(1)     NOT NULL DEFAULT 1,
    is_deleted      TINYINT(1)     NOT NULL DEFAULT 0,
    created_at      DATETIME(6),
    updated_at      DATETIME(6),
    created_by      CHAR(36),
    CONSTRAINT fk_products_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Seed standard categories for all existing tenants
INSERT INTO product_categories (id, tenant_id, name, sort_order, is_system, is_active, is_deleted, created_at, updated_at)
SELECT UUID(), t.id, pc.name, pc.sort_order, 1, 1, 0, NOW(6), NOW(6)
FROM tenants t
CROSS JOIN (
    SELECT 'Corrosion Inhibitor'  AS name, 1  AS sort_order UNION ALL
    SELECT 'Scale Inhibitor',              2               UNION ALL
    SELECT 'Biocide',                      3               UNION ALL
    SELECT 'Paraffin Inhibitor',           4               UNION ALL
    SELECT 'H2S Scavenger',               5               UNION ALL
    SELECT 'Oxygen Scavenger',             6               UNION ALL
    SELECT 'Demulsifier',                  7               UNION ALL
    SELECT 'Surfactant',                   8               UNION ALL
    SELECT 'pH Adjuster',                  9               UNION ALL
    SELECT 'Foamer',                       10              UNION ALL
    SELECT 'Other',                        11
) pc
WHERE t.is_deleted = 0;

-- Seed standard units for all existing tenants
INSERT INTO product_units (id, tenant_id, name, sort_order, is_system, is_active, is_deleted, created_at, updated_at)
SELECT UUID(), t.id, pu.name, pu.sort_order, 1, 1, 0, NOW(6), NOW(6)
FROM tenants t
CROSS JOIN (
    SELECT 'Gallon'          AS name, 1  AS sort_order UNION ALL
    SELECT 'Quart',                   2               UNION ALL
    SELECT 'Pint',                    3               UNION ALL
    SELECT 'Pound',                   4               UNION ALL
    SELECT 'Ounce',                   5               UNION ALL
    SELECT 'Drum (55 gal)',           6               UNION ALL
    SELECT 'Tote (275 gal)',          7               UNION ALL
    SELECT 'Barrel (42 gal)',         8               UNION ALL
    SELECT 'Liter',                   9               UNION ALL
    SELECT 'Kilogram',                10
) pu
WHERE t.is_deleted = 0;
