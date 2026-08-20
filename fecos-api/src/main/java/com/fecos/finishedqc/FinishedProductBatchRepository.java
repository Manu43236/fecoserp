package com.fecos.finishedqc;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FinishedProductBatchRepository extends JpaRepository<FinishedProductBatchEntity, UUID> {

    Page<FinishedProductBatchEntity> findAllByTenantIdAndIsDeletedFalseOrderByBlendDateDesc(UUID tenantId, Pageable pageable);

    Page<FinishedProductBatchEntity> findAllByTenantIdAndStatusAndIsDeletedFalseOrderByBlendDateDesc(UUID tenantId, FinishedProductStatus status, Pageable pageable);

    Optional<FinishedProductBatchEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByTenantIdAndBatchNumberStartingWith(UUID tenantId, String prefix);
}
