package com.fecos.routes;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
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
          AND (:from IS NULL OR r.routeDate >= :from)
          AND (:to IS NULL OR r.routeDate <= :to)
        ORDER BY r.routeDate DESC, r.createdAt DESC
        """)
    Page<RouteEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("status") RouteStatus status,
            @Param("driverId") UUID driverId,
            @Param("routeDate") LocalDate routeDate,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    /** Highest route number ever assigned for a tenant (incl. deleted, so numbers are never reused). */
    @Query("SELECT COALESCE(MAX(r.routeNumber), 0) FROM RouteEntity r WHERE r.tenantId = :tenantId")
    int maxRouteNumber(@Param("tenantId") UUID tenantId);

    Optional<RouteEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(UUID tenantId, RouteStatus status, java.time.LocalDate routeDate);

    /** Unassigned pool a driver can claim: PLANNED, no driver, today or overdue; optional client/lease filter (matched across stops). */
    @Query("""
        SELECT DISTINCT r FROM RouteEntity r
        WHERE r.tenantId = :tenantId
          AND r.isDeleted = false
          AND r.driverId IS NULL
          AND r.status = com.fecos.routes.RouteStatus.PLANNED
          AND r.routeDate <= :today
          AND (:leaseId IS NULL OR EXISTS (
                SELECT 1 FROM RouteStopEntity s
                WHERE s.routeId = r.id AND s.isDeleted = false AND s.leaseId = :leaseId))
          AND (:clientId IS NULL OR EXISTS (
                SELECT 1 FROM RouteStopEntity s JOIN LeaseEntity l ON l.id = s.leaseId
                WHERE s.routeId = r.id AND s.isDeleted = false AND l.clientId = :clientId))
        ORDER BY r.routeDate ASC, r.createdAt ASC
        """)
    List<RouteEntity> availableForClaim(
            @Param("tenantId") UUID tenantId,
            @Param("today") LocalDate today,
            @Param("clientId") UUID clientId,
            @Param("leaseId") UUID leaseId);

    /** Atomic claim — assigns the driver only if the route is still unclaimed and PLANNED. Returns rows affected (1 = won, 0 = lost). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE RouteEntity r SET r.driverId = :uid
        WHERE r.id = :id AND r.tenantId = :tenantId
          AND r.isDeleted = false
          AND r.driverId IS NULL
          AND r.status = com.fecos.routes.RouteStatus.PLANNED
        """)
    int claim(@Param("id") UUID id, @Param("tenantId") UUID tenantId, @Param("uid") UUID uid);

    boolean existsByTenantIdAndDriverIdAndStatusAndIsDeletedFalseAndIdNot(
            UUID tenantId, UUID driverId, RouteStatus status, UUID id);
}
