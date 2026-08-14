package com.fecos.products;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "products")
public class ProductEntity extends TenantAwareEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "product_code", length = 50)
    private String productCode;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_per_unit", precision = 10, scale = 4)
    private BigDecimal pricePerUnit;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
