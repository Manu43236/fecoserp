package com.fecos.servicevisits;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "service_visit_stops")
public class ServiceVisitStopEntity extends TenantAwareEntity {

    @Column(name = "service_visit_id", nullable = false)
    private UUID serviceVisitId;

    @Column(name = "well_id", nullable = false)
    private UUID wellId;

    @Column(nullable = false)
    private int sequence = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ServiceVisitStopStatus status = ServiceVisitStopStatus.PENDING;

    @Column(name = "sample_collected", nullable = false)
    private boolean sampleCollected = false;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
