package com.fecos.reports;

import java.util.UUID;

public record GenerateReportRequest(
        ReportType reportType,
        UUID clientId,
        Integer periodMonth,
        Integer periodYear
) {}
