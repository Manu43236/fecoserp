package com.fecos.routes;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouteStopRepository extends JpaRepository<RouteStopEntity, UUID> {

    List<RouteStopEntity> findAllByRouteIdAndIsDeletedFalseOrderBySequenceOrderAsc(UUID routeId);

    Optional<RouteStopEntity> findByIdAndRouteIdAndIsDeletedFalse(UUID id, UUID routeId);

    List<RouteStopEntity> findAllByRouteIdInAndIsDeletedFalse(java.util.Collection<UUID> routeIds);

    int countByRouteIdAndIsDeletedFalse(UUID routeId);

    int countByRouteIdAndStatusAndIsDeletedFalse(UUID routeId, RouteStopStatus status);

    /** Skipped stops across all routes — for the office to review and follow up. */
    @Query("""
        SELECT s.id, s.routeId, r.routeDate, w.wellName, l.leaseName, c.companyName, s.skipReason, u.fullName
        FROM RouteStopEntity s
        JOIN RouteEntity r ON r.id = s.routeId
        JOIN WellEntity w ON w.id = s.wellId
        JOIN LeaseEntity l ON l.id = s.leaseId
        JOIN ClientEntity c ON c.id = l.clientId
        LEFT JOIN UserEntity u ON u.id = r.driverId
        WHERE s.tenantId = :tenantId
          AND s.isDeleted = false
          AND s.status = com.fecos.routes.RouteStopStatus.SKIPPED
          AND r.isDeleted = false
        ORDER BY r.routeDate DESC
        """)
    List<Object[]> skippedStops(@Param("tenantId") UUID tenantId);
}
