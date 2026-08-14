# FECOS Module Plan: Warehouse / Inventory

## Summary
Tracks physical chemical inventory for a tenant across multiple named warehouse locations.
Admins manage warehouses (CRUD) and record stock movements (RECEIPT / ISSUE / ADJUSTMENT).
Current stock per product per warehouse is derived from the transaction ledger — never stored directly.

## Requirements
- **Who**: ADMIN (full CRUD), MANAGER + ACCOUNT_REP (read only)
- **Trigger**: Chemicals arrive at facility / get issued / adjusted manually
- **Data**: Warehouses (name, location), Transactions (type, product, warehouse, qty, unit, notes, date)
- **Stock**: Derived — SUM(quantity) GROUP BY warehouse × product. Read-only.
- **Approval**: None
- **Mobile**: No — web only
- **Multi-tenant**: Yes — scoped to tenant_id NOT NULL

## Out of scope (v1)
- Trucks as warehouses (belongs in Dispatch module)
- Purchase Orders
- Truck loading workflows

## Mirror Module
Products module — same entity/service/controller/frontend pattern.

---

## Layer 1: Database

### V14__create_warehouses.sql
```sql
CREATE TABLE warehouses (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id   CHAR(36)     NOT NULL,
    name        VARCHAR(150) NOT NULL,
    location    VARCHAR(255),
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME(6),
    updated_at  DATETIME(6),
    created_by  CHAR(36),
    CONSTRAINT fk_warehouses_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

### V15__create_inventory_transactions.sql
```sql
CREATE TABLE inventory_transactions (
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
```

Stock = SUM(quantity) per (warehouse_id, product_id). Signed: RECEIPT=+, ISSUE=-, ADJUSTMENT=±.

---

## Layer 2: API

Package: `com.fecos.inventory`

| File | Notes |
|---|---|
| WarehouseEntity | extends TenantAwareEntity |
| WarehouseRepository | findByIdAndTenantIdAndIsDeletedFalse, existsByNameAndTenantIdAndIsDeletedFalse |
| WarehouseRequest | name, location |
| WarehouseResponse | static from() |
| WarehouseService | list/get/create/update/delete |
| WarehouseController | /api/v1/inventory/warehouses |
| InventoryTransactionType | enum: RECEIPT, ISSUE, ADJUSTMENT |
| InventoryTransactionEntity | extends TenantAwareEntity |
| InventoryTransactionRepository | paginated search |
| InventoryTransactionRequest | warehouseId, productId, type, quantity, unit, notes, transactionDate |
| InventoryTransactionResponse | static from() with names resolved |
| StockResponse | record: warehouseId, warehouseName, productId, productName, unit, currentQty |
| InventoryService | stock query + transaction list/create |
| InventoryController | /api/v1/inventory/stock + /api/v1/inventory/transactions |

---

## Layer 3: Web

| File | Notes |
|---|---|
| src/api/warehouses.ts | CRUD |
| src/api/inventory.ts | stock list + transaction list + create |
| src/pages/tenant/InventoryPage.tsx | left-nav sidebar: Warehouses / Stock / Transactions |
| src/App.tsx | replace PlaceholderPage at /inventory |

### Sections
- **Warehouses**: table + right-side panel (create/edit) + detail drawer
- **Stock**: read-only table, warehouse filter, qty in JetBrains Mono, negative qty in red
- **Transactions**: paginated ledger, Record Transaction panel (type/warehouse/product/qty/unit/date/notes)

---

## Acceptance Criteria
- [ ] V14 + V15 run clean
- [ ] Warehouse CRUD works
- [ ] RECEIPT increases stock, ISSUE decreases
- [ ] Stock derived correctly from SUM
- [ ] Tenant isolation holds
- [ ] Zero TS build errors
- [ ] SearchableDropdown on all filters/selects
- [ ] var(--color-primary) on all buttons/headers
- [ ] Right-side panel w-[440px]
