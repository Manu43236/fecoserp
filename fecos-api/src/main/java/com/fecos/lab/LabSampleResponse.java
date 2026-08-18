package com.fecos.lab;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record LabSampleResponse(
        UUID id,
        String sampleNumber,
        SampleType sampleType,
        UUID wellId,
        String wellName,
        String leaseName,
        String clientName,
        UUID collectedById,
        String collectedByName,
        LocalDateTime collectedAt,
        LocalDateTime receivedAt,
        SamplePriority priority,
        String testsRequested,
        LabSampleStatus status,
        Instant createdAt,

        // Active treatment plan for this well
        UUID activeTreatmentPlanId,
        String activeTreatmentPlanStatus,

        // Flat approval status — always present so list views can display correctly
        ApprovalStatus approvalStatus,

        // Nested result (null if not yet entered)
        LabResultResponse result
) {
    public record LabResultResponse(
            UUID id,
            UUID labTechId,
            String labTechName,
            LocalDateTime completedAt,

            // Water Analysis
            Double calcium,
            Double magnesium,
            Double sodium,
            Double chlorides,
            Double sulfates,
            Double bicarbonates,
            Double iron,
            Double ph,
            Double tds,
            Double specificGravity,
            Double dissolvedOxygen,
            Double scalingIndex,
            Double corrosionPotential,

            // Bacteriological
            Double srbCount,
            Double apbCount,
            Double treatmentEffectiveness,

            // Scale Analysis
            String scaleType,
            ScaleSeverity scaleSeverity,
            String scaleRemediation,

            // Paraffin
            Double pourPoint,
            Double paraffinInhibitorEffectiveness,

            // Corrosion Wheel
            Double corrosionRate,
            Double corrosionInhibitorPerformance,

            // Failure Analysis
            String failureType,
            String failureRootCause,
            String failureRecommendation,

            // Oil in Water
            Double oilContent,

            // Notes & Alerts
            String labTechNotes,
            boolean hasCriticalValues,
            Instant alertSentAt,

            // Approval
            ApprovalStatus approvalStatus,
            UUID approvedById,
            String approvedByName,
            Instant approvedAt,
            String approvalNotes,
            boolean requiresTreatmentChange
    ) {
        public static LabResultResponse from(LabResultEntity e, String labTechName, String approvedByName) {
            return new LabResultResponse(
                    e.getId(), e.getLabTechId(), labTechName, e.getCompletedAt(),
                    e.getCalcium(), e.getMagnesium(), e.getSodium(), e.getChlorides(),
                    e.getSulfates(), e.getBicarbonates(), e.getIron(), e.getPh(),
                    e.getTds(), e.getSpecificGravity(), e.getDissolvedOxygen(),
                    e.getScalingIndex(), e.getCorrosionPotential(),
                    e.getSrbCount(), e.getApbCount(), e.getTreatmentEffectiveness(),
                    e.getScaleType(), e.getScaleSeverity(), e.getScaleRemediation(),
                    e.getPourPoint(), e.getParaffinInhibitorEffectiveness(),
                    e.getCorrosionRate(), e.getCorrosionInhibitorPerformance(),
                    e.getFailureType(), e.getFailureRootCause(), e.getFailureRecommendation(),
                    e.getOilContent(),
                    e.getLabTechNotes(), e.isHasCriticalValues(), e.getAlertSentAt(),
                    e.getApprovalStatus(), e.getApprovedById(), approvedByName,
                    e.getApprovedAt(), e.getApprovalNotes(), e.isRequiresTreatmentChange()
            );
        }
    }
}
