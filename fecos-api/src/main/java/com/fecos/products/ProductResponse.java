package com.fecos.products;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String productCode,
        String category,
        String unit,
        String description,
        BigDecimal pricePerUnit,
        boolean isActive,
        Instant createdAt
) {
    public static ProductResponse from(ProductEntity p) {
        return new ProductResponse(
                p.getId(), p.getName(), p.getProductCode(),
                p.getCategory(), p.getUnit(), p.getDescription(),
                p.getPricePerUnit(), p.isActive(), p.getCreatedAt()
        );
    }
}
