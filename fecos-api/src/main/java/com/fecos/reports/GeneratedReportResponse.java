package com.fecos.reports;

import java.time.Instant;
import java.util.UUID;

public record GeneratedReportResponse(
        UUID id,
        ReportType reportType,
        String reportTypeLabel,
        UUID clientId,
        String clientName,
        Integer periodMonth,
        Integer periodYear,
        String period,
        ReportStatus status,
        String generatedByName,
        Instant sentAt,
        String notes,
        Instant createdAt
) {}
