package com.fecos.lab;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "lab_samples")
public class LabSampleEntity extends TenantAwareEntity {

    @Column(name = "sample_number", nullable = false, length = 30)
    private String sampleNumber;

    // Bottle label minted on the Service Tech's device (e.g. LS-WELX1-PW-18/01).
    // Null for lab-created samples.
    @Column(name = "custody_code", length = 40)
    private String custodyCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "sample_type", nullable = false, length = 30)
    private SampleType sampleType;

    @Column(name = "well_id", nullable = false)
    private UUID wellId;

    @Column(name = "collected_by_id")
    private UUID collectedById;

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    // Null until the physical bottle is received at the bench (field-collected
    // samples start in COLLECTED with no receipt time).
    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    private SamplePriority priority = SamplePriority.ROUTINE;

    @Column(name = "tests_requested", columnDefinition = "TEXT")
    private String testsRequested;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LabSampleStatus status = LabSampleStatus.RECEIVED;

    @Column(name = "ref_seq")
    private Integer refSeq;

    @Column(name = "ref_number", length = 20)
    private String refNumber;
}
