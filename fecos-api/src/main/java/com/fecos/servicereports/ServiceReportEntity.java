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
@Table(name = "service_reports")
public class ServiceReportEntity extends TenantAwareEntity {

    @Column(name = "service_visit_stop_id", nullable = false)
    private UUID serviceVisitStopId;

    @Column(name = "pump_running", nullable = false)
    private boolean pumpRunning;

    @Column(name = "tank_level_before", precision = 5, scale = 2)
    private BigDecimal tankLevelBefore;

    @Column(name = "tank_level_after", precision = 5, scale = 2)
    private BigDecimal tankLevelAfter;

    @Column(name = "actual_rate", precision = 10, scale = 4)
    private BigDecimal actualRate;

    @Column(name = "soar", nullable = false)
    private boolean soar;

    @Column(name = "special_treat", columnDefinition = "TEXT")
    private String specialTreat;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "submitted_at")
    private Instant submittedAt;
}
