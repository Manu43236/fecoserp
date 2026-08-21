package com.fecos.servicevisits;

import java.util.UUID;

public record ServiceVisitStopResponse(
        UUID id,
        UUID wellId,
        String wellName,
        String leaseName,
        int sequence,
        ServiceVisitStopStatus status,
        boolean sampleCollected,
        String notes
) {}
