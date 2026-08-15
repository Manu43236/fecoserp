package com.fecos.programs;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TreatmentPlanResponse(
        UUID id,
        UUID wellId,
        String wellName,
        String leaseName,
        String clientName,
        UUID accountRepId,
        String accountRepName,
        TreatmentPlanStatus status,
        String notes,
        LocalDate startDate,
        LocalDate endDate,
        List<TreatmentPlanLineResponse> lines,
        Instant createdAt
) {
    public static TreatmentPlanResponse from(
            TreatmentPlanEntity p,
            String wellName,
            String leaseName,
            String clientName,
            String accountRepName,
            List<TreatmentPlanLineResponse> lines) {
        return new TreatmentPlanResponse(
                p.getId(),
                p.getWellId(),
                wellName,
                leaseName,
                clientName,
                p.getAccountRepId(),
                accountRepName,
                p.getStatus(),
                p.getNotes(),
                p.getStartDate(),
                p.getEndDate(),
                lines,
                p.getCreatedAt()
        );
    }
}
