ALTER TABLE routes
    ADD COLUMN pre_trip_confirmed_at DATETIME NULL,
    ADD COLUMN pre_trip_has_issues   BIT(1)   NULL,
    ADD COLUMN pre_trip_notes        TEXT      NULL;
