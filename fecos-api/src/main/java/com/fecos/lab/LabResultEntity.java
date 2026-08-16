package com.fecos.lab;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "lab_results")
public class LabResultEntity extends TenantAwareEntity {

    @Column(name = "sample_id", nullable = false, unique = true)
    private UUID sampleId;

    @Column(name = "lab_tech_id")
    private UUID labTechId;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Water Analysis
    @Column(name = "calcium")
    private Double calcium;

    @Column(name = "magnesium")
    private Double magnesium;

    @Column(name = "sodium")
    private Double sodium;

    @Column(name = "chlorides")
    private Double chlorides;

    @Column(name = "sulfates")
    private Double sulfates;

    @Column(name = "bicarbonates")
    private Double bicarbonates;

    @Column(name = "iron")
    private Double iron;

    @Column(name = "ph")
    private Double ph;

    @Column(name = "tds")
    private Double tds;

    @Column(name = "specific_gravity")
    private Double specificGravity;

    @Column(name = "dissolved_oxygen")
    private Double dissolvedOxygen;

    @Column(name = "scaling_index")
    private Double scalingIndex;

    @Column(name = "corrosion_potential")
    private Double corrosionPotential;

    // Bacteriological
    @Column(name = "srb_count")
    private Double srbCount;

    @Column(name = "apb_count")
    private Double apbCount;

    @Column(name = "treatment_effectiveness")
    private Double treatmentEffectiveness;

    // Scale Analysis
    @Column(name = "scale_type", length = 100)
    private String scaleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "scale_severity", length = 10)
    private ScaleSeverity scaleSeverity;

    @Column(name = "scale_remediation", columnDefinition = "TEXT")
    private String scaleRemediation;

    // Paraffin
    @Column(name = "pour_point")
    private Double pourPoint;

    @Column(name = "paraffin_inhibitor_effectiveness")
    private Double paraffinInhibitorEffectiveness;

    // Corrosion Wheel
    @Column(name = "corrosion_rate")
    private Double corrosionRate;

    @Column(name = "corrosion_inhibitor_performance")
    private Double corrosionInhibitorPerformance;

    // Failure Analysis
    @Column(name = "failure_type", length = 200)
    private String failureType;

    @Column(name = "failure_root_cause", columnDefinition = "TEXT")
    private String failureRootCause;

    @Column(name = "failure_recommendation", columnDefinition = "TEXT")
    private String failureRecommendation;

    // Oil in Water
    @Column(name = "oil_content")
    private Double oilContent;

    // Notes & Alerts
    @Column(name = "lab_tech_notes", columnDefinition = "TEXT")
    private String labTechNotes;

    @Column(name = "has_critical_values", nullable = false)
    private boolean hasCriticalValues = false;

    @Column(name = "alert_sent_at")
    private Instant alertSentAt;

    // Approval
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING_REVIEW;

    @Column(name = "approved_by_id")
    private UUID approvedById;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    @Column(name = "requires_treatment_change", nullable = false)
    private boolean requiresTreatmentChange = false;
}
