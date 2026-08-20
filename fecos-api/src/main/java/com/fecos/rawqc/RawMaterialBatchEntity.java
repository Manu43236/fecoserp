package com.fecos.rawqc;

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
@Table(name = "raw_material_batches")
public class RawMaterialBatchEntity extends TenantAwareEntity {

    @Column(name = "batch_number", nullable = false, length = 30)
    private String batchNumber;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "material_name", nullable = false)
    private String materialName;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "received_date", nullable = false)
    private LocalDate receivedDate;

    @Column(name = "supplier_lot_number", length = 100)
    private String supplierLotNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RawMaterialStatus status = RawMaterialStatus.PENDING;

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
}
