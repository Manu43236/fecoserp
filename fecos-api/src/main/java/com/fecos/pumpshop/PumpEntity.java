package com.fecos.pumpshop;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "pumps")
public class PumpEntity extends TenantAwareEntity {

    @Column(name = "serial_number", nullable = false, length = 100)
    private String serialNumber;

    @Column(name = "make", length = 100)
    private String make;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "pump_type", length = 100)
    private String pumpType;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner", nullable = false, length = 20)
    private PumpOwner owner = PumpOwner.OWN;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PumpStatus status = PumpStatus.IN_SHOP;

    @Column(name = "tank_id")
    private UUID tankId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
