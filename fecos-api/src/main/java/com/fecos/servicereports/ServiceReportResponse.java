package com.fecos.servicereports;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ServiceReportResponse(
        UUID id,
        UUID serviceVisitStopId,
        String wellName,
        String leaseName,
        String techName,
        boolean soar,
        String specialTreat,
        String notes,
        List<ServiceReportChemicalResponse> chemicals,
        Instant submittedAt,
        Instant createdAt
) {}
