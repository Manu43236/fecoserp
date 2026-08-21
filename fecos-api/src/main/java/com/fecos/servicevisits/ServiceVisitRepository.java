package com.fecos.servicevisits;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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
              AND (:date IS NULL OR v.visitDate = :date)
            ORDER BY v.visitDate DESC, v.createdAt DESC
            """,
        countQuery = """
            SELECT COUNT(v) FROM ServiceVisitEntity v
            WHERE v.tenantId = :tenantId
              AND v.isDeleted = false
              AND (:status IS NULL OR v.status = :status)
              AND (:techId IS NULL OR v.techId = :techId)
              AND (:date IS NULL OR v.visitDate = :date)
            """
    )
    Page<ServiceVisitEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("status") ServiceVisitStatus status,
            @Param("techId") UUID techId,
            @Param("date") LocalDate date,
            Pageable pageable);

    Optional<ServiceVisitEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
}
