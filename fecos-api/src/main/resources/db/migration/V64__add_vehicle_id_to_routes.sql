ALTER TABLE routes ADD COLUMN vehicle_id CHAR(36) NULL;
ALTER TABLE routes ADD CONSTRAINT fk_routes_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);
