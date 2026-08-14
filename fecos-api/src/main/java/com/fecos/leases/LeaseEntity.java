package com.fecos.leases;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "leases")
public class LeaseEntity extends TenantAwareEntity {

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "lease_name", nullable = false, length = 100)
    private String leaseName;

    @Column(name = "county", length = 100)
    private String county;

    @Column(name = "state", length = 50)
    private String state;

    @Column(name = "gps_lat", precision = 10, scale = 7)
    private BigDecimal gpsLat;

    @Column(name = "gps_lng", precision = 10, scale = 7)
    private BigDecimal gpsLng;

    @Column(name = "directions", columnDefinition = "TEXT")
    private String directions;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
