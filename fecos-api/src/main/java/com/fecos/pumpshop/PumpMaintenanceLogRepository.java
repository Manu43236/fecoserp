package com.fecos.pumpshop;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PumpMaintenanceLogRepository extends JpaRepository<PumpMaintenanceLogEntity, UUID> {

    List<PumpMaintenanceLogEntity> findAllByPumpIdOrderByPerformedAtDesc(UUID pumpId);
}
