package com.fecos.servicereports;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ServiceReportRepository extends JpaRepository<ServiceReportEntity, UUID> {

    Optional<ServiceReportEntity> findByServiceVisitStopIdAndIsDeletedFalse(UUID stopId);

    Optional<ServiceReportEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    @Query(
        value = """
            SELECT r FROM ServiceReportEntity r
            WHERE r.tenantId = :tenantId
              AND r.isDeleted = false
            ORDER BY r.submittedAt DESC, r.createdAt DESC
            """,
        countQuery = """
            SELECT COUNT(r) FROM ServiceReportEntity r
            WHERE r.tenantId = :tenantId
              AND r.isDeleted = false
            """
    )
    Page<ServiceReportEntity> findAllByTenant(@Param("tenantId") UUID tenantId, Pageable pageable);
}
