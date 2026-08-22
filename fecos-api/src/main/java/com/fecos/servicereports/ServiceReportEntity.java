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

    @Column(name = "performed_at")
    private Instant performedAt;

    @Column(name = "gps_lat", precision = 10, scale = 7)
    private BigDecimal gpsLat;

    @Column(name = "gps_lng", precision = 10, scale = 7)
    private BigDecimal gpsLng;

    @Column(name = "gps_captured_at")
    private Instant gpsCapturedAt;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "photo_captured_at")
    private Instant photoCapturedAt;

    @Column(name = "soar_note", columnDefinition = "TEXT")
    private String soarNote;

    @Column(name = "soar_ack_by")
    private UUID soarAckBy;

    @Column(name = "soar_ack_at")
    private Instant soarAckAt;

    @Column(name = "soar_ack_note", columnDefinition = "TEXT")
    private String soarAckNote;

    @Column(name = "sample_type", length = 50)
    private String sampleType;

    @Column(name = "sample_notes", columnDefinition = "TEXT")
    private String sampleNotes;

    @Column(name = "signature_url", length = 500)
    private String signatureUrl;

    @Column(name = "signer_name", length = 100)
    private String signerName;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "sample_photo_url", length = 500)
    private String samplePhotoUrl;
}
