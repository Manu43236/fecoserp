package com.fecos.servicevisits;

import java.time.LocalDate;
import java.util.UUID;

public record DueWellResponse(
        UUID wellId,
        String wellName,
        String leaseName,
        UUID planId,
        String schedule,
        LocalDate lastVisitedAt,
        Long daysSinceLastVisit
) {}
