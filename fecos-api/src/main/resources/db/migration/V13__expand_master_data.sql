-- V13: Add more standard product categories and units of measure

-- ── Additional product categories ─────────────────────────────────────────────
INSERT INTO product_categories (id, tenant_id, name, sort_order, is_system, is_active, is_deleted, created_at, updated_at) VALUES
(UUID(), NULL, 'Iron Control',            12, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Asphaltene Inhibitor',    13, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Wax Inhibitor',           14, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Pour Point Depressant',   15, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Gas Hydrate Inhibitor',   16, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Clay Stabilizer',         17, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Friction Reducer',        18, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Drag Reducer',            19, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Neutralizer',             20, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Flocculant',              21, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Emulsion Breaker',        22, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Descaler',                23, 1, 1, 0, NOW(6), NOW(6));

-- ── Additional units of measure ───────────────────────────────────────────────
INSERT INTO product_units (id, tenant_id, name, sort_order, is_system, is_active, is_deleted, created_at, updated_at) VALUES
(UUID(), NULL, 'Fluid Ounce',      11, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Milliliter',       12, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Gram',             13, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Metric Ton',       14, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Short Ton',        15, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Bag (50 lb)',      16, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Sack (100 lb)',    17, 1, 1, 0, NOW(6), NOW(6)),
(UUID(), NULL, 'Cubic Foot',       18, 1, 1, 0, NOW(6), NOW(6));
