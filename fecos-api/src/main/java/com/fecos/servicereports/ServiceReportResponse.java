package com.fecos.servicereports;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ServiceReportResponse(
        UUID id,
        UUID serviceVisitStopId,
        String wellName,
        String leaseName,
        String techName,
        boolean pumpRunning,
        BigDecimal tankLevelBefore,
        BigDecimal tankLevelAfter,
        BigDecimal actualRate,
        boolean soar,
        String specialTreat,
        String notes,
        List<ServiceReportChemicalResponse> chemicals,
        Instant submittedAt,
        Instant createdAt
) {}
