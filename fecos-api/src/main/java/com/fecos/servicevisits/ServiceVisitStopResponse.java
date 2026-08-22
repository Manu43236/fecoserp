package com.fecos.servicevisits;

import java.util.UUID;

public record ServiceVisitStopResponse(
        UUID id,
        UUID wellId,
        String wellName,
        String leaseName,
        String clientName,
        int sequence,
        ServiceVisitStopStatus status,
        boolean sampleCollected,
        boolean hasSoar,
        boolean soarAcknowledged,
        boolean hasReport,
        String notes
) {}
