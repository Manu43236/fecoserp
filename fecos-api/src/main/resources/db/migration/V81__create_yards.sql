-- Yards: a physical location (like a warehouse, but a container). Warehouses belong to a yard;
-- clients may optionally belong to a yard. (User <-> yard mapping comes with the Users & Roles rework.)

CREATE TABLE IF NOT EXISTS yards (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id   CHAR(36)     NOT NULL,
    name        VARCHAR(150) NOT NULL,
    location    VARCHAR(255),
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    created_by  CHAR(36),
    CONSTRAINT fk_yards_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Warehouse -> yard (required at the app layer; nullable column so existing rows can be backfilled).
ALTER TABLE warehouses ADD COLUMN yard_id CHAR(36) NULL;
ALTER TABLE warehouses ADD CONSTRAINT fk_warehouses_yard FOREIGN KEY (yard_id) REFERENCES yards(id);

-- Client -> yard (optional).
ALTER TABLE clients ADD COLUMN yard_id CHAR(36) NULL;
ALTER TABLE clients ADD CONSTRAINT fk_clients_yard FOREIGN KEY (yard_id) REFERENCES yards(id);

-- Seed one "Main Yard" per tenant so existing data has a home and new installs have a default.
INSERT INTO yards (id, tenant_id, name, location, is_active, is_deleted, created_at, updated_at)
SELECT UUID(), t.id, 'Main Yard', NULL, 1, 0, NOW(6), NOW(6)
FROM tenants t;

-- Attach existing warehouses to their tenant's Main Yard.
UPDATE warehouses w
JOIN yards y ON y.tenant_id = w.tenant_id AND y.name = 'Main Yard' AND y.is_deleted = 0
SET w.yard_id = y.id
WHERE w.yard_id IS NULL;
