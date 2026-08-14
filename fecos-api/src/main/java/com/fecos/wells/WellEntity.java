package com.fecos.wells;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "wells")
public class WellEntity extends TenantAwareEntity {

    @Column(name = "lease_id", nullable = false)
    private UUID leaseId;

    @Column(name = "well_name", nullable = false, length = 100)
    private String wellName;

    @Column(name = "well_number", length = 50)
    private String wellNumber;

    @Column(name = "api_number", length = 20)
    private String apiNumber;

    @Column(name = "pump_type", nullable = false, length = 100)
    private String pumpType = "Rod Pump";

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
