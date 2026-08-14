package com.fecos.masters;

import com.fecos.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "product_units")
public class ProductUnitEntity extends BaseEntity {

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "is_system", nullable = false)
    private boolean isSystem = false;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
