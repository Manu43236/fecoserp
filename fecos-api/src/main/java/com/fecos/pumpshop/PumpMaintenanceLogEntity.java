package com.fecos.pumpshop;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "pump_maintenance_logs")
public class PumpMaintenanceLogEntity extends TenantAwareEntity {

    @Column(name = "pump_id", nullable = false)
    private UUID pumpId;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false, length = 20)
    private MaintenanceType maintenanceType;

    @Column(name = "performed_at", nullable = false)
    private Instant performedAt;

    @Column(name = "performed_by_id")
    private UUID performedById;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
