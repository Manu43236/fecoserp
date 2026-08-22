package com.fecos.servicereports;

import java.util.UUID;

public record MyVisitStopResponse(
        UUID id,
        UUID wellId,
        String wellName,
        String leaseName,
        String clientName,
        int sequence,
        String status,
        boolean sampleCollected,
        boolean hasReport
) {}
