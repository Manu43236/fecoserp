package com.fecos.programs;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TreatmentPlanLineRepository extends JpaRepository<TreatmentPlanLineEntity, UUID> {

    List<TreatmentPlanLineEntity> findAllByProgramIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID programId);

    Optional<TreatmentPlanLineEntity> findByIdAndProgramIdAndIsDeletedFalse(UUID id, UUID programId);

    long countByProgramIdAndIsDeletedFalse(UUID programId);

    @org.springframework.data.jpa.repository.Query("""
        SELECT COUNT(l) > 0 FROM TreatmentPlanLineEntity l
        JOIN TreatmentPlanEntity p ON l.programId = p.id
        WHERE l.tankId = :tankId AND l.isDeleted = false
          AND p.status = :status AND p.isDeleted = false
        """)
    boolean existsActivePlanForTank(@org.springframework.data.repository.query.Param("tankId") UUID tankId,
                                    @org.springframework.data.repository.query.Param("status") TreatmentPlanStatus status);

    @org.springframework.data.jpa.repository.Query("""
        SELECT p.wellId FROM TreatmentPlanEntity p
        JOIN TreatmentPlanLineEntity l ON l.programId = p.id
        WHERE l.tankId = :tankId AND l.isDeleted = false AND p.isDeleted = false
        ORDER BY p.createdAt DESC
        """)
    List<UUID> findWellIdsByTankId(@org.springframework.data.repository.query.Param("tankId") UUID tankId);
}
