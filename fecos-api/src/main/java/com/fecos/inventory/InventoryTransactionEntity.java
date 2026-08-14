package com.fecos.inventory;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "inventory_transactions")
public class InventoryTransactionEntity extends TenantAwareEntity {

    @Column(name = "warehouse_id", nullable = false, updatable = false)
    private UUID warehouseId;

    @Column(name = "product_id", nullable = false, updatable = false)
    private UUID productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, updatable = false, length = 20)
    private InventoryTransactionType type;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "supplier_name", length = 150)
    private String supplierName;

    @Column(name = "created_by_name", length = 150)
    private String createdByName;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;
}
