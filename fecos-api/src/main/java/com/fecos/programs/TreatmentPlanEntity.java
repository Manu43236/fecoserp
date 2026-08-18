package com.fecos.programs;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "treatment_plans")
public class TreatmentPlanEntity extends TenantAwareEntity {

    @Column(name = "well_id")
    private UUID wellId;

    @Column(name = "account_rep_id")
    private UUID accountRepId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TreatmentPlanStatus status = TreatmentPlanStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "lab_sample_id")
    private UUID labSampleId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "paused_at")
    private Instant pausedAt;

    @Column(name = "resumed_at")
    private Instant resumedAt;

    @Column(name = "superseded_at")
    private Instant supersededAt;
}
