package com.fecos.routes;

import java.math.BigDecimal;
import java.util.UUID;

public record RouteStopItemResponse(
        UUID id,
        UUID stopId,
        UUID productId,
        String productName,
        BigDecimal quantity,
        String unit,
        String notes
) {
    public static RouteStopItemResponse from(RouteStopItemEntity e, String productName) {
        return new RouteStopItemResponse(
                e.getId(), e.getStopId(), e.getProductId(),
                productName, e.getQuantity(), e.getUnit(), e.getNotes()
        );
    }
}
