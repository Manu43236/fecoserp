package com.fecos.servicevisits;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceVisitStopRepository extends JpaRepository<ServiceVisitStopEntity, UUID> {

    List<ServiceVisitStopEntity> findAllByServiceVisitIdAndIsDeletedFalseOrderBySequenceAsc(UUID serviceVisitId);

    Optional<ServiceVisitStopEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    @Query("""
        SELECT MAX(v.visitDate) FROM ServiceVisitEntity v
        JOIN ServiceVisitStopEntity s ON s.serviceVisitId = v.id
        WHERE v.tenantId = :tenantId
          AND s.wellId   = :wellId
          AND s.status   = com.fecos.servicevisits.ServiceVisitStopStatus.COMPLETED
          AND v.isDeleted = false
          AND s.isDeleted = false
        """)
    Optional<LocalDate> findLastCompletedVisitDateForWell(
            @Param("tenantId") UUID tenantId,
            @Param("wellId") UUID wellId);
}
