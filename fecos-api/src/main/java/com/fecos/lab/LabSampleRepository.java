package com.fecos.lab;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface LabSampleRepository extends JpaRepository<LabSampleEntity, UUID> {

    @Query("""
        SELECT s FROM LabSampleEntity s
        WHERE s.tenantId = :tenantId
          AND s.isDeleted = false
          AND (:status IS NULL OR s.status = :status)
          AND (:wellId IS NULL OR s.wellId = :wellId)
          AND (:sampleType IS NULL OR s.sampleType = :sampleType)
          AND (:dateFrom IS NULL OR s.receivedAt >= :dateFrom)
          AND (:dateTo IS NULL OR s.receivedAt <= :dateTo)
        ORDER BY s.receivedAt DESC, s.createdAt DESC
        """)
    Page<LabSampleEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("status") LabSampleStatus status,
            @Param("wellId") UUID wellId,
            @Param("sampleType") SampleType sampleType,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            Pageable pageable);

    Optional<LabSampleEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByTenantIdAndIsDeletedFalse(UUID tenantId);

    long countByTenantIdAndStatusAndIsDeletedFalse(UUID tenantId, LabSampleStatus status);
}
