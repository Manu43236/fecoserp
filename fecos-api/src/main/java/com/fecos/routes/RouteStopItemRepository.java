package com.fecos.routes;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouteStopItemRepository extends JpaRepository<RouteStopItemEntity, UUID> {

    List<RouteStopItemEntity> findAllByStopIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID stopId);

    Optional<RouteStopItemEntity> findByIdAndStopIdAndIsDeletedFalse(UUID id, UUID stopId);
}
