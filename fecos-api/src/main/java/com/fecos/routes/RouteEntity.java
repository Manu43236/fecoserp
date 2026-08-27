package com.fecos.routes;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "routes")
public class RouteEntity extends TenantAwareEntity {

    @Column(name = "driver_id", nullable = false)
    private UUID driverId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "truck_number", length = 50)
    private String truckNumber;

    @Column(name = "route_date", nullable = false)
    private LocalDate routeDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RouteStatus status = RouteStatus.PLANNED;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "load_confirmed_at")
    private java.time.LocalDateTime loadConfirmedAt;

    @Column(name = "pre_trip_confirmed_at")
    private java.time.LocalDateTime preTripConfirmedAt;

    @Column(name = "pre_trip_has_issues")
    private Boolean preTripHasIssues;

    @Column(name = "pre_trip_notes", columnDefinition = "TEXT")
    private String preTripNotes;
}
