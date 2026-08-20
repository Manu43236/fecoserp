package com.fecos.vehicles;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "vehicles")
public class VehicleEntity extends TenantAwareEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 20)
    private VehicleType vehicleType;

    @Column(nullable = false, length = 100)
    private String make;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "license_plate", nullable = false, length = 50)
    private String licensePlate;

    @Column(name = "vin_number", length = 17)
    private String vinNumber;

    @Column(name = "dot_number", length = 50)
    private String dotNumber;

    @Column(name = "current_mileage")
    private Integer currentMileage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
