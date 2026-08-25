ALTER TABLE inventory_transactions
    ADD COLUMN reference_type VARCHAR(30)  NULL,
    ADD COLUMN reference_id   CHAR(36)     NULL;
