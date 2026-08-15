package com.fecos.programs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TreatmentPlanRepository extends JpaRepository<TreatmentPlanEntity, UUID> {

    @Query("""
        SELECT p FROM TreatmentPlanEntity p
        WHERE p.tenantId = :tenantId
          AND p.isDeleted = false
          AND (:status IS NULL OR p.status = :status)
          AND (:wellId IS NULL OR p.wellId = :wellId)
          AND (:accountRepId IS NULL OR p.accountRepId = :accountRepId)
        ORDER BY p.createdAt DESC
        """)
    Page<TreatmentPlanEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("status") TreatmentPlanStatus status,
            @Param("wellId") UUID wellId,
            @Param("accountRepId") UUID accountRepId,
            Pageable pageable);

    Optional<TreatmentPlanEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    List<TreatmentPlanEntity> findAllByTenantIdAndWellIdAndStatusAndIsDeletedFalse(
            UUID tenantId, UUID wellId, TreatmentPlanStatus status);
}
