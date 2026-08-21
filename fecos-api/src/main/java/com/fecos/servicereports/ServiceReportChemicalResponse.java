package com.fecos.servicereports;

import java.math.BigDecimal;
import java.util.UUID;

public record ServiceReportChemicalResponse(
        UUID id,
        UUID productId,
        String productName,
        BigDecimal gallonsDelivered,
        BigDecimal gallonsOnHand,
        BigDecimal recRate,
        BigDecimal actualRate,
        boolean onRate,
        boolean soar,
        String comments,
        int sortOrder
) {}
