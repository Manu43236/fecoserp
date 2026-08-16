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

    @Enumerated(EnumType.STRING)
    @Column(name = "sample_type", nullable = false, length = 30)
    private SampleType sampleType;

    @Column(name = "well_id", nullable = false)
    private UUID wellId;

    @Column(name = "collected_by_id")
    private UUID collectedById;

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    private SamplePriority priority = SamplePriority.ROUTINE;

    @Column(name = "tests_requested", columnDefinition = "TEXT")
    private String testsRequested;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private LabSampleStatus status = LabSampleStatus.RECEIVED;
}
