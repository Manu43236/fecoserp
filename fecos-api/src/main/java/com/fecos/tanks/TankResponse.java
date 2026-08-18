package com.fecos.tanks;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TankResponse(
        UUID id,
        String serialNumber,
        BigDecimal capacityGallons,
        UUID wellId,
        String wellName,
        String leaseName,
        String clientName,
        TankStatus status,
        Instant installedAt,
        Instant removedAt,
        BigDecimal calculatedLevelPct,
        BigDecimal calculatedLevelGallons,
        List<TankEventResponse> events,
        Instant createdAt
) {
    public record TankEventResponse(
            UUID id,
            TankEventType eventType,
            BigDecimal amountGallons,
            BigDecimal recRate,
            BigDecimal levelPct,
            String performedByName,
            Instant eventAt,
            Instant createdAt
    ) {}
}
