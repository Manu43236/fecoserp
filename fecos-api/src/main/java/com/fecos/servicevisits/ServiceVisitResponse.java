package com.fecos.servicevisits;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ServiceVisitResponse(
        UUID id,
        LocalDate visitDate,
        UUID techId,
        String techName,
        ServiceVisitStatus status,
        String notes,
        List<ServiceVisitStopResponse> stops,
        Instant createdAt
) {}
