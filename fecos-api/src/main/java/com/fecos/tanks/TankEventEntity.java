package com.fecos.tanks;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "tank_events")
public class TankEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    @Column(name = "tank_id", nullable = false)
    private UUID tankId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    private TankEventType eventType;

    @Column(name = "amount_gallons", precision = 10, scale = 2)
    private BigDecimal amountGallons;

    @Column(name = "rec_rate", precision = 10, scale = 4)
    private BigDecimal recRate;

    @Column(name = "level_pct", precision = 5, scale = 2)
    private BigDecimal levelPct;

    @Column(name = "performed_by_id")
    private UUID performedById;

    @Column(name = "event_at", nullable = false)
    private Instant eventAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;
}
