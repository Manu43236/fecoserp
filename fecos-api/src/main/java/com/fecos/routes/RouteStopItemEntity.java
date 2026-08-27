package com.fecos.routes;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "route_stop_items")
public class RouteStopItemEntity extends TenantAwareEntity {

    @Column(name = "stop_id", nullable = false)
    private UUID stopId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "loaded_qty", precision = 12, scale = 4)
    private java.math.BigDecimal loadedQty;

    @Column(name = "actual_qty_delivered", precision = 12, scale = 4)
    private java.math.BigDecimal actualQtyDelivered;
}
