package com.fecos.finishedqc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record FinishedProductBatchResponse(
        UUID id,
        String batchNumber,
        UUID productId,
        String productName,
        BigDecimal quantity,
        String unit,
        LocalDate blendDate,
        FinishedProductStatus status,
        String appearance,
        Boolean colorOk,
        String odor,
        BigDecimal ph,
        BigDecimal specificGravity,
        String notes,
        String testedByName,
        LocalDateTime testedAt,
        UUID warehouseId,
        String warehouseName,
        boolean movedToWarehouse,
        LocalDateTime movedAt,
        Instant createdAt
) {}
