ALTER TABLE sign_in_logs
    DROP FOREIGN KEY fk_sign_in_logs_tenant,
    MODIFY COLUMN tenant_id CHAR(36) NULL;
