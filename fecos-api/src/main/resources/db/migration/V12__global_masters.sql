-- V12: Convert per-tenant seeded master lists to global (tenant_id = NULL)
-- Tenants see global entries automatically; custom entries stay per-tenant.
-- Auto-promotion: if two tenants add the same custom name, it becomes global.

-- ── pump_types ───────────────────────────────────────────────────────────────

ALTER TABLE pump_types DROP FOREIGN KEY fk_pump_types_tenant;
ALTER TABLE pump_types MODIFY COLUMN tenant_id CHAR(36) NULL;
ALTER TABLE pump_types ADD CONSTRAINT fk_pump_types_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id);

DELETE FROM pump_types WHERE is_system = 1;

INSERT INTO pump_types (id, tenant_id, name, sort_order, is_system, is_active, is_deleted, created_at, updated_at) VALUES
(UUID(), NULL, 'Rod Pump',                        1,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'ESP (Electric Submersible Pump)', 2,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Gas Lift',                        3,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Plunger Lift',                    4,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Chemical Injector',               5,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Progressive Cavity Pump (PCP)',   6,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Jet Pump',                        7,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Hydraulic Pump',                  8,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Natural Flow',                    9,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'None',                            10, 1, 1, 0, NOW(6), NOW(6));

-- ── product_categories ───────────────────────────────────────────────────────

ALTER TABLE product_categories DROP FOREIGN KEY fk_product_categories_tenant;
ALTER TABLE product_categories MODIFY COLUMN tenant_id CHAR(36) NULL;
ALTER TABLE product_categories ADD CONSTRAINT fk_product_categories_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id);

DELETE FROM product_categories WHERE is_system = 1;

INSERT INTO product_categories (id, tenant_id, name, sort_order, is_system, is_active, is_deleted, created_at, updated_at) VALUES
(UUID(), NULL, 'Corrosion Inhibitor', 1,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Scale Inhibitor',     2,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Biocide',             3,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Paraffin Inhibitor',  4,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'H2S Scavenger',       5,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Oxygen Scavenger',    6,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Demulsifier',         7,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Surfactant',          8,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'pH Adjuster',         9,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Foamer',              10, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Other',               11, 1, 1, 0, NOW(6), NOW(6));

-- ── product_units ────────────────────────────────────────────────────────────

ALTER TABLE product_units DROP FOREIGN KEY fk_product_units_tenant;
ALTER TABLE product_units MODIFY COLUMN tenant_id CHAR(36) NULL;
ALTER TABLE product_units ADD CONSTRAINT fk_product_units_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id);

DELETE FROM product_units WHERE is_system = 1;

INSERT INTO product_units (id, tenant_id, name, sort_order, is_system, is_active, is_deleted, created_at, updated_at) VALUES
(UUID(), NULL, 'Gallon',           1,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Quart',            2,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Pint',             3,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Pound',            4,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Ounce',            5,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Drum (55 gal)',    6,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Tote (275 gal)',   7,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Barrel (42 gal)',  8,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Liter',            9,  1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Kilogram',         10, 1, 1, 0, NOW(6), NOW(6));
