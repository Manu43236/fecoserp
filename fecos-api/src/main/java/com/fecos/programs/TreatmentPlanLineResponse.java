package com.fecos.programs;

import java.math.BigDecimal;
import java.util.UUID;

public record TreatmentPlanLineResponse(
        UUID id,
        UUID programId,
        UUID productId,
        String productName,
        BigDecimal recRate,
        TreatmentPlanMethod method,
        TreatmentPlanSchedule schedule,
        String notes
) {
    public static TreatmentPlanLineResponse from(TreatmentPlanLineEntity l, String productName) {
        return new TreatmentPlanLineResponse(
                l.getId(),
                l.getProgramId(),
                l.getProductId(),
                productName,
                l.getRecRate(),
                l.getMethod(),
                l.getSchedule(),
                l.getNotes()
        );
    }
}
