ALTER TABLE routes ADD COLUMN warehouse_id CHAR(36) NULL;
ALTER TABLE routes ADD CONSTRAINT fk_routes_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id);
