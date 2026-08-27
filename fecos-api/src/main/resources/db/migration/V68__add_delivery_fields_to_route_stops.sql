ALTER TABLE route_stop_items
    ADD COLUMN actual_qty_delivered DECIMAL(12, 4) NULL;

ALTER TABLE route_stops
    ADD COLUMN skip_reason VARCHAR(100) NULL;
