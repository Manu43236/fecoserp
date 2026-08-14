package com.fecos.inventory;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "warehouses")
public class WarehouseEntity extends TenantAwareEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
