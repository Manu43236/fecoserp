package com.fecos.inventory;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "warehouses")
public class WarehouseEntity extends TenantAwareEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "location", length = 255)
    private String location;

    /** The yard this warehouse belongs to (required). */
    @Column(name = "yard_id")
    private UUID yardId;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
