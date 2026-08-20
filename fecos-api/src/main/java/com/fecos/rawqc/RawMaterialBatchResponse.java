package com.fecos.rawqc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record RawMaterialBatchResponse(
        UUID id,
        String batchNumber,
        String supplierName,
        String materialName,
        BigDecimal quantity,
        String unit,
        LocalDate receivedDate,
        String supplierLotNumber,
        RawMaterialStatus status,
        String appearance,
        Boolean colorOk,
        String odor,
        BigDecimal ph,
        BigDecimal specificGravity,
        String notes,
        String testedByName,
        LocalDateTime testedAt,
        Instant createdAt
) {}
