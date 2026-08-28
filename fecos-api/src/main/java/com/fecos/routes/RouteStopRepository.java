package com.fecos.routes;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouteStopRepository extends JpaRepository<RouteStopEntity, UUID> {

    List<RouteStopEntity> findAllByRouteIdAndIsDeletedFalseOrderBySequenceOrderAsc(UUID routeId);

    Optional<RouteStopEntity> findByIdAndRouteIdAndIsDeletedFalse(UUID id, UUID routeId);

    int countByRouteIdAndIsDeletedFalse(UUID routeId);

    int countByRouteIdAndStatusAndIsDeletedFalse(UUID routeId, RouteStopStatus status);
}
