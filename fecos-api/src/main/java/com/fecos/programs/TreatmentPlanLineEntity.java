package com.fecos.programs;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "treatment_plan_lines")
public class TreatmentPlanLineEntity extends TenantAwareEntity {

    @Column(name = "program_id", nullable = false)
    private UUID programId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "rec_rate", nullable = false, precision = 12, scale = 4)
    private BigDecimal recRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, length = 20)
    private TreatmentPlanMethod method;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule", length = 20)
    private TreatmentPlanSchedule schedule;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
