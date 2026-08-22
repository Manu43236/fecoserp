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
        BigDecimal recRatePrevious,
        String recRateUpdatedByName,
        Instant recRateUpdatedAt,
        TreatmentPlanMethod method,
        TreatmentPlanSchedule schedule,
        String notes,
        TankOwner tankOwner,
        BigDecimal tankLevelPct,
        Instant tankLevelCheckedAt,
        UUID tankId,
        String tankSerial,
        BigDecimal tankCapacityGallons,
        BigDecimal calculatedLevelPct,
        String thirdPartyName,
        BigDecimal thirdPartyCapacityGallons,
        String thirdPartySerial,
        boolean pumpDeployed,
        UUID pumpId,
        String pumpSerial
) {
    public static TreatmentPlanLineResponse from(TreatmentPlanLineEntity l, String productName,
            BigDecimal calculatedLevelPct, boolean pumpDeployed, UUID pumpId, String pumpSerial,
            String recRateUpdatedByName, String tankSerial, BigDecimal tankCapacityGallons) {
        return new TreatmentPlanLineResponse(
                l.getId(),
                l.getProgramId(),
                l.getProductId(),
                productName,
                l.getRecRate(),
                l.getRecRatePrevious(),
                recRateUpdatedByName,
                l.getRecRateUpdatedAt(),
                l.getMethod(),
                l.getSchedule(),
                l.getNotes(),
                l.getTankOwner(),
                l.getTankLevelPct(),
                l.getTankLevelCheckedAt(),
                l.getTankId(),
                tankSerial,
                tankCapacityGallons,
                calculatedLevelPct,
                l.getThirdPartyName(),
                l.getThirdPartyCapacityGallons(),
                l.getThirdPartySerial(),
                pumpDeployed,
                pumpId,
                pumpSerial
        );
    }
}
