package com.fecos.tanks;

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
@Table(name = "tanks")
public class TankEntity extends TenantAwareEntity {

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "capacity_gallons", nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityGallons;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner", nullable = false, length = 20)
    private TankOwner owner = TankOwner.OWN;

    /** Owning client when owner = THIRD_PARTY and the tank belongs to a known client. */
    @Column(name = "client_id")
    private UUID clientId;

    /** Free-text owner name when owner = THIRD_PARTY and it is not a known client ("Others"). */
    @Column(name = "third_party_name", length = 150)
    private String thirdPartyName;

    @Column(name = "well_id")
    private UUID wellId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TankStatus status = TankStatus.AVAILABLE;

    @Column(name = "installed_at")
    private Instant installedAt;

    @Column(name = "removed_at")
    private Instant removedAt;
}
