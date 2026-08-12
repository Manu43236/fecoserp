ALTER TABLE tenants
    ADD COLUMN owner_name    VARCHAR(120) NULL,
    ADD COLUMN contact_phone VARCHAR(20)  NULL,
    ADD COLUMN contact_email VARCHAR(120) NULL;
