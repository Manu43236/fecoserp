package com.fecos.inventory;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class InventoryTransactionResponse {

    private UUID id;
    private UUID warehouseId;
    private String warehouseName;
    private UUID productId;
    private String productName;
    private InventoryTransactionType type;
    private BigDecimal quantity;
    private String unit;
    private String notes;
    private String supplierName;
    private LocalDate transactionDate;
    private UUID createdBy;
    private String createdByName;
    private Instant createdAt;
    private String referenceType;
    private UUID referenceId;

    public static InventoryTransactionResponse from(
            InventoryTransactionEntity t, String warehouseName, String productName) {
        InventoryTransactionResponse r = new InventoryTransactionResponse();
        r.id              = t.getId();
        r.warehouseId     = t.getWarehouseId();
        r.warehouseName   = warehouseName;
        r.productId       = t.getProductId();
        r.productName     = productName;
        r.type            = t.getType();
        r.quantity        = t.getQuantity();
        r.unit            = t.getUnit();
        r.notes           = t.getNotes();
        r.supplierName    = t.getSupplierName();
        r.transactionDate = t.getTransactionDate();
        r.createdBy       = t.getCreatedBy();
        r.createdByName   = t.getCreatedByName();
        r.createdAt       = t.getCreatedAt();
        r.referenceType   = t.getReferenceType();
        r.referenceId     = t.getReferenceId();
        return r;
    }
}
