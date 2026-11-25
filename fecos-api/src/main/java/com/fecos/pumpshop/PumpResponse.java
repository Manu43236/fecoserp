package com.fecos.pumpshop;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PumpResponse(
        UUID id,
        String refNumber,
        String serialNumber,
        String make,
        String model,
        String pumpType,
        PumpOwner owner,
        UUID ownerClientId,
        String ownerClientName,
        String thirdPartyName,
        PumpStatus status,
        UUID tankId,
        String tankSerial,
        UUID wellId,
        String wellName,
        String leaseName,
        String clientName,
        String notes,
        boolean onActiveTreatment,
        List<MaintenanceLogResponse> maintenanceLogs,
        Instant createdAt
) {
    public record MaintenanceLogResponse(
            UUID id,
            MaintenanceType maintenanceType,
            Instant performedAt,
            String performedByName,
            String notes,
            Instant createdAt
    ) {}
}
