package com.fecos.rawqc;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RawMaterialBatchRepository extends JpaRepository<RawMaterialBatchEntity, UUID> {

    Page<RawMaterialBatchEntity> findAllByTenantIdAndIsDeletedFalseOrderByReceivedDateDesc(UUID tenantId, Pageable pageable);

    Page<RawMaterialBatchEntity> findAllByTenantIdAndStatusAndIsDeletedFalseOrderByReceivedDateDesc(UUID tenantId, RawMaterialStatus status, Pageable pageable);

    Optional<RawMaterialBatchEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByTenantIdAndBatchNumberStartingWith(UUID tenantId, String prefix);

    @Query("SELECT COALESCE(MAX(b.refSeq), 0) FROM RawMaterialBatchEntity b WHERE b.tenantId = :tenantId")
    int maxRefSeq(@Param("tenantId") UUID tenantId);
}
