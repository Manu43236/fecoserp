package com.fecos.programs;

import com.fecos.common.TenantAwareEntity;
import com.fecos.tanks.TankOwner;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// V59: rec_rate_previous, rec_rate_updated_by, rec_rate_updated_at are audit columns set by mobile service tech

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

    @Enumerated(EnumType.STRING)
    @Column(name = "tank_owner", length = 20)
    private TankOwner tankOwner;

    @Column(name = "tank_level_pct", precision = 5, scale = 2)
    private BigDecimal tankLevelPct;

    @Column(name = "tank_level_checked_at")
    private Instant tankLevelCheckedAt;

    @Column(name = "tank_id")
    private UUID tankId;

    @Column(name = "third_party_name", length = 255)
    private String thirdPartyName;

    @Column(name = "third_party_capacity_gallons", precision = 10, scale = 2)
    private BigDecimal thirdPartyCapacityGallons;

    @Column(name = "third_party_serial", length = 100)
    private String thirdPartySerial;

    @Column(name = "rec_rate_previous", precision = 12, scale = 4)
    private BigDecimal recRatePrevious;

    @Column(name = "rec_rate_updated_by")
    private UUID recRateUpdatedBy;

    @Column(name = "rec_rate_updated_at")
    private Instant recRateUpdatedAt;
}
