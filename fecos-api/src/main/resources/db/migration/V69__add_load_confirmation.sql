ALTER TABLE routes
    ADD COLUMN load_confirmed_at DATETIME NULL;

ALTER TABLE route_stop_items
    ADD COLUMN loaded_qty DECIMAL(12, 4) NULL;
