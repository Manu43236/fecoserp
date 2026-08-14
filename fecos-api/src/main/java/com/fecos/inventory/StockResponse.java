package com.fecos.inventory;

import java.math.BigDecimal;
import java.util.UUID;

public record StockResponse(
        UUID warehouseId,
        String warehouseName,
        UUID productId,
        String productName,
        String unit,
        BigDecimal currentQty
) {}
