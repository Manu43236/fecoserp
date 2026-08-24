package com.fecos.servicevisits;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceVisitRepository extends JpaRepository<ServiceVisitEntity, UUID> {

    @Query(
        value = """
            SELECT v FROM ServiceVisitEntity v
            WHERE v.tenantId = :tenantId
              AND v.isDeleted = false
              AND (:status IS NULL OR v.status = :status)
              AND (:techId IS NULL OR v.techId = :techId)
              AND (:dateFrom IS NULL OR v.visitDate >= :dateFrom)
              AND (:dateTo IS NULL OR v.visitDate <= :dateTo)
            ORDER BY v.visitDate DESC, v.createdAt DESC
            """,
        countQuery = """
            SELECT COUNT(v) FROM ServiceVisitEntity v
            WHERE v.tenantId = :tenantId
              AND v.isDeleted = false
              AND (:status IS NULL OR v.status = :status)
              AND (:techId IS NULL OR v.techId = :techId)
              AND (:dateFrom IS NULL OR v.visitDate >= :dateFrom)
              AND (:dateTo IS NULL OR v.visitDate <= :dateTo)
            """
    )
    Page<ServiceVisitEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("status") ServiceVisitStatus status,
            @Param("techId") UUID techId,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            Pageable pageable);

    Optional<ServiceVisitEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    @Query("""
            SELECT v FROM ServiceVisitEntity v
            WHERE v.tenantId = :tenantId
              AND v.techId = :techId
              AND v.isDeleted = false
              AND v.visitDate > :from
            ORDER BY v.visitDate ASC
            """)
    List<ServiceVisitEntity> findUpcomingForTech(
            @Param("tenantId") UUID tenantId,
            @Param("techId") UUID techId,
            @Param("from") LocalDate from);
}
