ALTER TABLE inventory_transactions
    ADD COLUMN supplier_name VARCHAR(150) NULL AFTER notes;
