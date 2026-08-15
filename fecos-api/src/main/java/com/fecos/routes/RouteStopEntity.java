package com.fecos.routes;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "route_stops")
public class RouteStopEntity extends TenantAwareEntity {

    @Column(name = "route_id", nullable = false)
    private UUID routeId;

    @Column(name = "lease_id", nullable = false)
    private UUID leaseId;

    @Column(name = "well_id", nullable = false)
    private UUID wellId;

    @Column(name = "sequence_order", nullable = false)
    private int sequenceOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RouteStopStatus status = RouteStopStatus.PENDING;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
