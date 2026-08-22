package com.fecos.servicevisits;

import com.fecos.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "service_visits")
public class ServiceVisitEntity extends TenantAwareEntity {

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(name = "tech_id", nullable = false)
    private UUID techId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ServiceVisitStatus status = ServiceVisitStatus.SCHEDULED;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
