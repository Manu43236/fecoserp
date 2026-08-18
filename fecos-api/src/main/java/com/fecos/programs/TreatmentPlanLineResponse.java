package com.fecos.programs;

import com.fecos.tanks.TankOwner;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TreatmentPlanLineResponse(
        UUID id,
        UUID programId,
        UUID productId,
        String productName,
        BigDecimal recRate,
        TreatmentPlanMethod method,
        TreatmentPlanSchedule schedule,
        String notes,
        TankOwner tankOwner,
        BigDecimal tankLevelPct,
        Instant tankLevelCheckedAt,
        UUID tankId,
        BigDecimal calculatedLevelPct
) {
    public static TreatmentPlanLineResponse from(TreatmentPlanLineEntity l, String productName, BigDecimal calculatedLevelPct) {
        return new TreatmentPlanLineResponse(
                l.getId(),
                l.getProgramId(),
                l.getProductId(),
                productName,
                l.getRecRate(),
                l.getMethod(),
                l.getSchedule(),
                l.getNotes(),
                l.getTankOwner(),
                l.getTankLevelPct(),
                l.getTankLevelCheckedAt(),
                l.getTankId(),
                calculatedLevelPct
        );
    }
}
