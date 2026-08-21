package com.fecos.servicereports;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "service_report_chemicals")
public class ServiceReportChemicalEntity extends TenantAwareEntity {

    @Column(name = "service_report_id", nullable = false)
    private UUID serviceReportId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "gallons_delivered", precision = 10, scale = 4)
    private BigDecimal gallonsDelivered;

    @Column(name = "gallons_on_hand", precision = 10, scale = 4)
    private BigDecimal gallonsOnHand;

    @Column(name = "rec_rate", precision = 10, scale = 4)
    private BigDecimal recRate;

    @Column(name = "actual_rate", precision = 10, scale = 4)
    private BigDecimal actualRate;

    @Column(name = "on_rate", nullable = false)
    private boolean onRate;

    @Column(name = "soar", nullable = false)
    private boolean soar;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 1;
}
