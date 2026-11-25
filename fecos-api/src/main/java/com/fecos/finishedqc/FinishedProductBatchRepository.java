package com.fecos.finishedqc;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface FinishedProductBatchRepository extends JpaRepository<FinishedProductBatchEntity, UUID> {

    Page<FinishedProductBatchEntity> findAllByTenantIdAndIsDeletedFalseOrderByBlendDateDesc(UUID tenantId, Pageable pageable);

    Page<FinishedProductBatchEntity> findAllByTenantIdAndStatusAndIsDeletedFalseOrderByBlendDateDesc(UUID tenantId, FinishedProductStatus status, Pageable pageable);

    Optional<FinishedProductBatchEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByTenantIdAndBatchNumberStartingWith(UUID tenantId, String prefix);

    @Query("SELECT COALESCE(MAX(b.refSeq), 0) FROM FinishedProductBatchEntity b WHERE b.tenantId = :tenantId")
    int maxRefSeq(@Param("tenantId") UUID tenantId);
}
