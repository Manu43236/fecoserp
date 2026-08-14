package com.fecos.leases;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LeaseResponse(
        UUID id,
        UUID clientId,
        String clientName,
        String leaseName,
        String county,
        String state,
        BigDecimal gpsLat,
        BigDecimal gpsLng,
        String directions,
        boolean isActive,
        Instant createdAt
) {
    public static LeaseResponse from(LeaseEntity l, String clientName) {
        return new LeaseResponse(
                l.getId(),
                l.getClientId(),
                clientName,
                l.getLeaseName(),
                l.getCounty(),
                l.getState(),
                l.getGpsLat(),
                l.getGpsLng(),
                l.getDirections(),
                l.isActive(),
                l.getCreatedAt()
        );
    }
}
