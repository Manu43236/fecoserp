package com.fecos.servicevisits;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ServiceVisitResponse(
        UUID id,
        String refNumber,
        String name,
        LocalDate visitDate,
        UUID techId,
        String techName,
        ServiceVisitStatus status,
        String notes,
        List<ServiceVisitStopResponse> stops,
        String createdByName,
        Instant createdAt
) {}
