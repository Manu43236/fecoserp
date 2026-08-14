CREATE TABLE IF NOT EXISTS inventory_transactions (
    id               CHAR(36)      NOT NULL PRIMARY KEY,
    tenant_id        CHAR(36)      NOT NULL,
    warehouse_id     CHAR(36)      NOT NULL,
    product_id       CHAR(36)      NOT NULL,
    type             VARCHAR(20)   NOT NULL,
    quantity         DECIMAL(12,4) NOT NULL,
    unit             VARCHAR(50)   NOT NULL,
    notes            TEXT,
    transaction_date DATE          NOT NULL,
    is_deleted       TINYINT(1)    NOT NULL DEFAULT 0,
    created_at       DATETIME(6),
    updated_at       DATETIME(6),
    created_by       CHAR(36),
    CONSTRAINT fk_inv_tx_tenant    FOREIGN KEY (tenant_id)    REFERENCES tenants(id),
    CONSTRAINT fk_inv_tx_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    CONSTRAINT fk_inv_tx_product   FOREIGN KEY (product_id)   REFERENCES products(id)
);
