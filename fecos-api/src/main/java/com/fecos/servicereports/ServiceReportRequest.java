package com.fecos.servicereports;

import java.math.BigDecimal;
import java.util.List;

public record ServiceReportRequest(
        boolean pumpRunning,
        BigDecimal tankLevelBefore,
        BigDecimal tankLevelAfter,
        BigDecimal actualRate,
        boolean soar,
        String specialTreat,
        String notes,
        List<ServiceReportChemicalRequest> chemicals
) {}
