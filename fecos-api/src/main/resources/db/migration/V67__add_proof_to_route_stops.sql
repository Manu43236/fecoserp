ALTER TABLE route_stops
    ADD COLUMN delivery_lat       DOUBLE       NULL,
    ADD COLUMN delivery_lng       DOUBLE       NULL,
    ADD COLUMN delivery_photo_url TEXT         NULL,
    ADD COLUMN delivered_at       DATETIME     NULL;
