package com.fecos.servicereports;

import java.util.List;

public record ServiceReportRequest(
        boolean soar,
        String specialTreat,
        String notes,
        List<ServiceReportChemicalRequest> chemicals
) {}
