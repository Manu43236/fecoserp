package com.fecos.servicereports;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "service_report_treatment_lines")
public class ServiceReportTreatmentLineEntity extends TenantAwareEntity {

    @Column(name = "service_report_id", nullable = false)
    private UUID serviceReportId;

    @Column(name = "plan_line_id", nullable = false)
    private UUID planLineId;

    @Column(name = "tank_id")
    private UUID tankId;

    @Column(name = "method", nullable = false, length = 20)
    private String method;

    // CI fields
    @Column(name = "pump_running")
    private Boolean pumpRunning;

    @Column(name = "rate_found", precision = 10, scale = 4)
    private BigDecimal rateFound;

    @Column(name = "rate_set_to", precision = 10, scale = 4)
    private BigDecimal rateSetTo;

    @Column(name = "on_rate")
    private Boolean onRate;

    // Batch fields
    @Column(name = "applied")
    private Boolean applied;

    @Column(name = "quantity_applied", precision = 10, scale = 4)
    private BigDecimal quantityApplied;

    // Field readings
    @Column(name = "tank_level_pct", precision = 5, scale = 2)
    private BigDecimal tankLevelPct;

    @Column(name = "deviation_reason", columnDefinition = "TEXT")
    private String deviationReason;

    @Column(name = "pump_down_reason", columnDefinition = "TEXT")
    private String pumpDownReason;

    // Common
    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "recorded_at")
    private Instant recordedAt;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 1;

    @Column(name = "product_name", length = 255)
    private String productName;
}
