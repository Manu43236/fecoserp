package com.fecos.routes;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface RouteRepository extends JpaRepository<RouteEntity, UUID> {

    @Query("""
        SELECT r FROM RouteEntity r
        WHERE r.tenantId = :tenantId
          AND r.isDeleted = false
          AND (:status IS NULL OR r.status = :status)
          AND (:driverId IS NULL OR r.driverId = :driverId)
          AND (:routeDate IS NULL OR r.routeDate = :routeDate)
        ORDER BY r.routeDate DESC, r.createdAt DESC
        """)
    Page<RouteEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("status") RouteStatus status,
            @Param("driverId") UUID driverId,
            @Param("routeDate") LocalDate routeDate,
            Pageable pageable);

    Optional<RouteEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(UUID tenantId, RouteStatus status, java.time.LocalDate routeDate);
}
