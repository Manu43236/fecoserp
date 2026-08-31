package com.fecos.reports;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "generated_reports")
public class GeneratedReportEntity extends TenantAwareEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 30)
    private ReportType reportType;

    @Column(name = "client_id")
    private UUID clientId;

    @Column(name = "period_month")
    private Integer periodMonth;

    @Column(name = "period_year")
    private Integer periodYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReportStatus status = ReportStatus.READY;

    @Column(name = "generated_by", nullable = false)
    private UUID generatedBy;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
