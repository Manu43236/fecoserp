-- Adds ref_seq (INT) and ref_number (VARCHAR 20) to every primary module table.
-- ref_number format: {MODULE_CODE}-{tenant_number}-{seq}  e.g. TK-01-7
-- Routes already have route_number; this migration adds ref_number only for routes.
-- All procedures are idempotent.

-- ── Helper macro pattern: for each table we:
--   1. Add ref_seq (skipped for routes — route_number serves as seq)
--   2. Backfill ref_seq via ROW_NUMBER per tenant
--   3. Add ref_number
--   4. Backfill ref_number from tenant.tenant_number + seq
--   5. Add unique index (tenant_id, ref_number)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── yards ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_yards;
DELIMITER $$
CREATE PROCEDURE fecos_v87_yards()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'yards' AND column_name = 'ref_seq') THEN
        ALTER TABLE yards ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE yards y JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM yards) x ON x.id = y.id SET y.ref_seq = x.rn WHERE y.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'yards' AND column_name = 'ref_number') THEN
        ALTER TABLE yards ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE yards y JOIN tenants t ON t.id = y.tenant_id SET y.ref_number = CONCAT('Y-', t.tenant_number, '-', y.ref_seq) WHERE y.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'yards' AND index_name = 'uq_yards_tenant_ref') THEN
        ALTER TABLE yards ADD CONSTRAINT uq_yards_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_yards();
DROP PROCEDURE IF EXISTS fecos_v87_yards;

-- ── warehouses ────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_warehouses;
DELIMITER $$
CREATE PROCEDURE fecos_v87_warehouses()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'warehouses' AND column_name = 'ref_seq') THEN
        ALTER TABLE warehouses ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE warehouses w JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM warehouses) x ON x.id = w.id SET w.ref_seq = x.rn WHERE w.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'warehouses' AND column_name = 'ref_number') THEN
        ALTER TABLE warehouses ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE warehouses w JOIN tenants t ON t.id = w.tenant_id SET w.ref_number = CONCAT('WH-', t.tenant_number, '-', w.ref_seq) WHERE w.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'warehouses' AND index_name = 'uq_warehouses_tenant_ref') THEN
        ALTER TABLE warehouses ADD CONSTRAINT uq_warehouses_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_warehouses();
DROP PROCEDURE IF EXISTS fecos_v87_warehouses;

-- ── routes (ref_number only — route_number is the seq) ───────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_routes;
DELIMITER $$
CREATE PROCEDURE fecos_v87_routes()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'routes' AND column_name = 'ref_number') THEN
        ALTER TABLE routes ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE routes r JOIN tenants t ON t.id = r.tenant_id SET r.ref_number = CONCAT('R-', t.tenant_number, '-', r.route_number) WHERE r.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'routes' AND index_name = 'uq_routes_tenant_ref') THEN
        ALTER TABLE routes ADD CONSTRAINT uq_routes_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_routes();
DROP PROCEDURE IF EXISTS fecos_v87_routes;

-- ── leases ────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_leases;
DELIMITER $$
CREATE PROCEDURE fecos_v87_leases()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'leases' AND column_name = 'ref_seq') THEN
        ALTER TABLE leases ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE leases l JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM leases) x ON x.id = l.id SET l.ref_seq = x.rn WHERE l.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'leases' AND column_name = 'ref_number') THEN
        ALTER TABLE leases ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE leases l JOIN tenants t ON t.id = l.tenant_id SET l.ref_number = CONCAT('L-', t.tenant_number, '-', l.ref_seq) WHERE l.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'leases' AND index_name = 'uq_leases_tenant_ref') THEN
        ALTER TABLE leases ADD CONSTRAINT uq_leases_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_leases();
DROP PROCEDURE IF EXISTS fecos_v87_leases;

-- ── wells ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_wells;
DELIMITER $$
CREATE PROCEDURE fecos_v87_wells()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'wells' AND column_name = 'ref_seq') THEN
        ALTER TABLE wells ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE wells w JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM wells) x ON x.id = w.id SET w.ref_seq = x.rn WHERE w.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'wells' AND column_name = 'ref_number') THEN
        ALTER TABLE wells ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE wells w JOIN tenants t ON t.id = w.tenant_id SET w.ref_number = CONCAT('WL-', t.tenant_number, '-', w.ref_seq) WHERE w.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'wells' AND index_name = 'uq_wells_tenant_ref') THEN
        ALTER TABLE wells ADD CONSTRAINT uq_wells_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_wells();
DROP PROCEDURE IF EXISTS fecos_v87_wells;

-- ── tanks ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_tanks;
DELIMITER $$
CREATE PROCEDURE fecos_v87_tanks()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tanks' AND column_name = 'ref_seq') THEN
        ALTER TABLE tanks ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE tanks tk JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM tanks) x ON x.id = tk.id SET tk.ref_seq = x.rn WHERE tk.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tanks' AND column_name = 'ref_number') THEN
        ALTER TABLE tanks ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE tanks tk JOIN tenants t ON t.id = tk.tenant_id SET tk.ref_number = CONCAT('TK-', t.tenant_number, '-', tk.ref_seq) WHERE tk.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'tanks' AND index_name = 'uq_tanks_tenant_ref') THEN
        ALTER TABLE tanks ADD CONSTRAINT uq_tanks_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_tanks();
DROP PROCEDURE IF EXISTS fecos_v87_tanks;

-- ── treatment_plans ───────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_treatment_plans;
DELIMITER $$
CREATE PROCEDURE fecos_v87_treatment_plans()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'treatment_plans' AND column_name = 'ref_seq') THEN
        ALTER TABLE treatment_plans ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE treatment_plans tp JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM treatment_plans) x ON x.id = tp.id SET tp.ref_seq = x.rn WHERE tp.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'treatment_plans' AND column_name = 'ref_number') THEN
        ALTER TABLE treatment_plans ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE treatment_plans tp JOIN tenants t ON t.id = tp.tenant_id SET tp.ref_number = CONCAT('TP-', t.tenant_number, '-', tp.ref_seq) WHERE tp.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'treatment_plans' AND index_name = 'uq_treatment_plans_tenant_ref') THEN
        ALTER TABLE treatment_plans ADD CONSTRAINT uq_treatment_plans_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_treatment_plans();
DROP PROCEDURE IF EXISTS fecos_v87_treatment_plans;

-- ── pumps ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_pumps;
DELIMITER $$
CREATE PROCEDURE fecos_v87_pumps()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pumps' AND column_name = 'ref_seq') THEN
        ALTER TABLE pumps ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE pumps p JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM pumps) x ON x.id = p.id SET p.ref_seq = x.rn WHERE p.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pumps' AND column_name = 'ref_number') THEN
        ALTER TABLE pumps ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE pumps p JOIN tenants t ON t.id = p.tenant_id SET p.ref_number = CONCAT('P-', t.tenant_number, '-', p.ref_seq) WHERE p.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pumps' AND index_name = 'uq_pumps_tenant_ref') THEN
        ALTER TABLE pumps ADD CONSTRAINT uq_pumps_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_pumps();
DROP PROCEDURE IF EXISTS fecos_v87_pumps;

-- ── service_visits ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_service_visits;
DELIMITER $$
CREATE PROCEDURE fecos_v87_service_visits()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'service_visits' AND column_name = 'ref_seq') THEN
        ALTER TABLE service_visits ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE service_visits sv JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM service_visits) x ON x.id = sv.id SET sv.ref_seq = x.rn WHERE sv.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'service_visits' AND column_name = 'ref_number') THEN
        ALTER TABLE service_visits ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE service_visits sv JOIN tenants t ON t.id = sv.tenant_id SET sv.ref_number = CONCAT('SV-', t.tenant_number, '-', sv.ref_seq) WHERE sv.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'service_visits' AND index_name = 'uq_service_visits_tenant_ref') THEN
        ALTER TABLE service_visits ADD CONSTRAINT uq_service_visits_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_service_visits();
DROP PROCEDURE IF EXISTS fecos_v87_service_visits;

-- ── service_reports ───────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_service_reports;
DELIMITER $$
CREATE PROCEDURE fecos_v87_service_reports()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'service_reports' AND column_name = 'ref_seq') THEN
        ALTER TABLE service_reports ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE service_reports sr JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM service_reports) x ON x.id = sr.id SET sr.ref_seq = x.rn WHERE sr.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'service_reports' AND column_name = 'ref_number') THEN
        ALTER TABLE service_reports ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE service_reports sr JOIN tenants t ON t.id = sr.tenant_id SET sr.ref_number = CONCAT('SR-', t.tenant_number, '-', sr.ref_seq) WHERE sr.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'service_reports' AND index_name = 'uq_service_reports_tenant_ref') THEN
        ALTER TABLE service_reports ADD CONSTRAINT uq_service_reports_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_service_reports();
DROP PROCEDURE IF EXISTS fecos_v87_service_reports;

-- ── clients ───────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_clients;
DELIMITER $$
CREATE PROCEDURE fecos_v87_clients()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'ref_seq') THEN
        ALTER TABLE clients ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE clients c JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM clients) x ON x.id = c.id SET c.ref_seq = x.rn WHERE c.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clients' AND column_name = 'ref_number') THEN
        ALTER TABLE clients ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE clients c JOIN tenants t ON t.id = c.tenant_id SET c.ref_number = CONCAT('CL-', t.tenant_number, '-', c.ref_seq) WHERE c.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'clients' AND index_name = 'uq_clients_tenant_ref') THEN
        ALTER TABLE clients ADD CONSTRAINT uq_clients_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_clients();
DROP PROCEDURE IF EXISTS fecos_v87_clients;

-- ── users ─────────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_users;
DELIMITER $$
CREATE PROCEDURE fecos_v87_users()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'ref_seq') THEN
        ALTER TABLE users ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE users u JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM users) x ON x.id = u.id SET u.ref_seq = x.rn WHERE u.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'ref_number') THEN
        ALTER TABLE users ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE users u JOIN tenants t ON t.id = u.tenant_id SET u.ref_number = CONCAT('USR-', t.tenant_number, '-', u.ref_seq) WHERE u.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'uq_users_tenant_ref') THEN
        ALTER TABLE users ADD CONSTRAINT uq_users_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_users();
DROP PROCEDURE IF EXISTS fecos_v87_users;

-- ── vehicles ──────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_vehicles;
DELIMITER $$
CREATE PROCEDURE fecos_v87_vehicles()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'vehicles' AND column_name = 'ref_seq') THEN
        ALTER TABLE vehicles ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE vehicles v JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM vehicles) x ON x.id = v.id SET v.ref_seq = x.rn WHERE v.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'vehicles' AND column_name = 'ref_number') THEN
        ALTER TABLE vehicles ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE vehicles v JOIN tenants t ON t.id = v.tenant_id SET v.ref_number = CONCAT('V-', t.tenant_number, '-', v.ref_seq) WHERE v.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'vehicles' AND index_name = 'uq_vehicles_tenant_ref') THEN
        ALTER TABLE vehicles ADD CONSTRAINT uq_vehicles_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_vehicles();
DROP PROCEDURE IF EXISTS fecos_v87_vehicles;

-- ── products ──────────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_products;
DELIMITER $$
CREATE PROCEDURE fecos_v87_products()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'ref_seq') THEN
        ALTER TABLE products ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE products p JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM products) x ON x.id = p.id SET p.ref_seq = x.rn WHERE p.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'ref_number') THEN
        ALTER TABLE products ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE products p JOIN tenants t ON t.id = p.tenant_id SET p.ref_number = CONCAT('PRD-', t.tenant_number, '-', p.ref_seq) WHERE p.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'uq_products_tenant_ref') THEN
        ALTER TABLE products ADD CONSTRAINT uq_products_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_products();
DROP PROCEDURE IF EXISTS fecos_v87_products;

-- ── lab_samples ───────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_lab_samples;
DELIMITER $$
CREATE PROCEDURE fecos_v87_lab_samples()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'lab_samples' AND column_name = 'ref_seq') THEN
        ALTER TABLE lab_samples ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE lab_samples s JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM lab_samples) x ON x.id = s.id SET s.ref_seq = x.rn WHERE s.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'lab_samples' AND column_name = 'ref_number') THEN
        ALTER TABLE lab_samples ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE lab_samples s JOIN tenants t ON t.id = s.tenant_id SET s.ref_number = CONCAT('SMP-', t.tenant_number, '-', s.ref_seq) WHERE s.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'lab_samples' AND index_name = 'uq_lab_samples_tenant_ref') THEN
        ALTER TABLE lab_samples ADD CONSTRAINT uq_lab_samples_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_lab_samples();
DROP PROCEDURE IF EXISTS fecos_v87_lab_samples;

-- ── raw_material_batches ──────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_raw_material_batches;
DELIMITER $$
CREATE PROCEDURE fecos_v87_raw_material_batches()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'raw_material_batches' AND column_name = 'ref_seq') THEN
        ALTER TABLE raw_material_batches ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE raw_material_batches b JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM raw_material_batches) x ON x.id = b.id SET b.ref_seq = x.rn WHERE b.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'raw_material_batches' AND column_name = 'ref_number') THEN
        ALTER TABLE raw_material_batches ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE raw_material_batches b JOIN tenants t ON t.id = b.tenant_id SET b.ref_number = CONCAT('RMB-', t.tenant_number, '-', b.ref_seq) WHERE b.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'raw_material_batches' AND index_name = 'uq_raw_material_batches_tenant_ref') THEN
        ALTER TABLE raw_material_batches ADD CONSTRAINT uq_raw_material_batches_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_raw_material_batches();
DROP PROCEDURE IF EXISTS fecos_v87_raw_material_batches;

-- ── finished_product_batches ──────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_finished_product_batches;
DELIMITER $$
CREATE PROCEDURE fecos_v87_finished_product_batches()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finished_product_batches' AND column_name = 'ref_seq') THEN
        ALTER TABLE finished_product_batches ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE finished_product_batches b JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM finished_product_batches) x ON x.id = b.id SET b.ref_seq = x.rn WHERE b.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finished_product_batches' AND column_name = 'ref_number') THEN
        ALTER TABLE finished_product_batches ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE finished_product_batches b JOIN tenants t ON t.id = b.tenant_id SET b.ref_number = CONCAT('FPB-', t.tenant_number, '-', b.ref_seq) WHERE b.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'finished_product_batches' AND index_name = 'uq_finished_product_batches_tenant_ref') THEN
        ALTER TABLE finished_product_batches ADD CONSTRAINT uq_finished_product_batches_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_finished_product_batches();
DROP PROCEDURE IF EXISTS fecos_v87_finished_product_batches;

-- ── inventory_transactions ────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS fecos_v87_inventory_transactions;
DELIMITER $$
CREATE PROCEDURE fecos_v87_inventory_transactions()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'inventory_transactions' AND column_name = 'ref_seq') THEN
        ALTER TABLE inventory_transactions ADD COLUMN ref_seq INT NULL;
    END IF;
    UPDATE inventory_transactions tx JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS rn FROM inventory_transactions) x ON x.id = tx.id SET tx.ref_seq = x.rn WHERE tx.ref_seq IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'inventory_transactions' AND column_name = 'ref_number') THEN
        ALTER TABLE inventory_transactions ADD COLUMN ref_number VARCHAR(20) NULL;
    END IF;
    UPDATE inventory_transactions tx JOIN tenants t ON t.id = tx.tenant_id SET tx.ref_number = CONCAT('TX-', t.tenant_number, '-', tx.ref_seq) WHERE tx.ref_number IS NULL;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'inventory_transactions' AND index_name = 'uq_inventory_transactions_tenant_ref') THEN
        ALTER TABLE inventory_transactions ADD CONSTRAINT uq_inventory_transactions_tenant_ref UNIQUE (tenant_id, ref_number);
    END IF;
END$$
DELIMITER ;
CALL fecos_v87_inventory_transactions();
DROP PROCEDURE IF EXISTS fecos_v87_inventory_transactions;
