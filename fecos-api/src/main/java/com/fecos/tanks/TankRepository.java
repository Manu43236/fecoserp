package com.fecos.tanks;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TankRepository extends JpaRepository<TankEntity, UUID> {

    Page<TankEntity> findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    List<TankEntity> findAllByTenantIdAndWellIdAndIsDeletedFalse(UUID tenantId, UUID wellId);

    Optional<TankEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
}
