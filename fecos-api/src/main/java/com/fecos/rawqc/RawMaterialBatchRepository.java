package com.fecos.rawqc;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RawMaterialBatchRepository extends JpaRepository<RawMaterialBatchEntity, UUID> {

    Page<RawMaterialBatchEntity> findAllByTenantIdAndIsDeletedFalseOrderByReceivedDateDesc(UUID tenantId, Pageable pageable);

    Page<RawMaterialBatchEntity> findAllByTenantIdAndStatusAndIsDeletedFalseOrderByReceivedDateDesc(UUID tenantId, RawMaterialStatus status, Pageable pageable);

    Optional<RawMaterialBatchEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByTenantIdAndBatchNumberStartingWith(UUID tenantId, String prefix);
}
