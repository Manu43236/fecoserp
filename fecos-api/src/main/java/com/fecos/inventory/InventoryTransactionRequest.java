package com.fecos.inventory;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class InventoryTransactionRequest {

    @NotNull
    private UUID warehouseId;

    @NotNull
    private UUID productId;

    @NotNull
    private InventoryTransactionType type;

    @NotNull
    @Positive
    private BigDecimal quantity;

    @NotBlank
    @Size(max = 50)
    private String unit;

    private String notes;

    @Size(max = 150)
    private String supplierName;

    @NotNull
    private LocalDate transactionDate;
}
