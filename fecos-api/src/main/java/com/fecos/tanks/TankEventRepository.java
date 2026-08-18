package com.fecos.tanks;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TankEventRepository extends JpaRepository<TankEventEntity, UUID> {

    List<TankEventEntity> findAllByTankIdOrderByEventAtDesc(UUID tankId);

    List<TankEventEntity> findAllByTankIdAndEventTypeInOrderByEventAtDesc(UUID tankId, List<TankEventType> types);
}
