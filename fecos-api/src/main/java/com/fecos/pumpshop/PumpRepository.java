package com.fecos.pumpshop;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface PumpRepository extends JpaRepository<PumpEntity, UUID> {

    Page<PumpEntity> findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<PumpEntity> findAllByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, PumpStatus status, Pageable pageable);

    Optional<PumpEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    @Query("SELECT p FROM PumpEntity p WHERE p.tankId = :tankId AND p.status = :status AND p.isDeleted = false")
    Optional<PumpEntity> findDeployedPumpForTank(@Param("tankId") UUID tankId, @Param("status") PumpStatus status);
}
