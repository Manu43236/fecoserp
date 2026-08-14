package com.fecos.wells;

import java.time.Instant;
import java.util.UUID;

public record WellResponse(
        UUID id,
        UUID leaseId,
        String leaseName,
        String clientName,
        String wellName,
        String wellNumber,
        String apiNumber,
        String pumpType,
        boolean isActive,
        Instant createdAt
) {
    public static WellResponse from(WellEntity w, String leaseName, String clientName) {
        return new WellResponse(
                w.getId(),
                w.getLeaseId(),
                leaseName,
                clientName,
                w.getWellName(),
                w.getWellNumber(),
                w.getApiNumber(),
                w.getPumpType(),
                w.isActive(),
                w.getCreatedAt()
        );
    }
}
