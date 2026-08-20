package com.fecos.finishedqc;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "finished_product_batches")
public class FinishedProductBatchEntity extends TenantAwareEntity {

    @Column(name = "batch_number", nullable = false, length = 30)
    private String batchNumber;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "blend_date", nullable = false)
    private LocalDate blendDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private FinishedProductStatus status = FinishedProductStatus.PENDING;

    @Column(name = "appearance", length = 50)
    private String appearance;

    @Column(name = "color_ok")
    private Boolean colorOk;

    @Column(name = "odor", length = 50)
    private String odor;

    @Column(name = "ph", precision = 5, scale = 2)
    private BigDecimal ph;

    @Column(name = "specific_gravity", precision = 6, scale = 4)
    private BigDecimal specificGravity;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "tested_by_id")
    private UUID testedById;

    @Column(name = "tested_at")
    private LocalDateTime testedAt;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "moved_to_warehouse", nullable = false)
    private boolean movedToWarehouse = false;

    @Column(name = "moved_at")
    private LocalDateTime movedAt;
}
