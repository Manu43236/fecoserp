ALTER TABLE inventory_transactions
    ADD COLUMN created_by_name VARCHAR(150) NULL AFTER created_by;
