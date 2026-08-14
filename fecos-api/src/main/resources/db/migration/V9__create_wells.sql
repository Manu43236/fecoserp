CREATE TABLE IF NOT EXISTS wells (
    id                  CHAR(36)        NOT NULL PRIMARY KEY,
    tenant_id           CHAR(36)        NOT NULL,
    lease_id            CHAR(36)        NOT NULL,
    well_name           VARCHAR(100)    NOT NULL,
    well_number         VARCHAR(50),
    api_number          VARCHAR(20),
    pump_type           ENUM('CHEMICAL_INJECTOR','PLUNGER','GAS_LIFT','NONE') NOT NULL DEFAULT 'CHEMICAL_INJECTOR',
    target_inject_rate  DECIMAL(10, 4),
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    is_deleted          TINYINT(1)      NOT NULL DEFAULT 0,
    created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by          CHAR(36),
    CONSTRAINT fk_wells_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT fk_wells_lease  FOREIGN KEY (lease_id)  REFERENCES leases(id)
);
