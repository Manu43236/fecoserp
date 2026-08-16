package com.fecos.programs;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TreatmentPlanLineRepository extends JpaRepository<TreatmentPlanLineEntity, UUID> {

    List<TreatmentPlanLineEntity> findAllByProgramIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID programId);

    Optional<TreatmentPlanLineEntity> findByIdAndProgramIdAndIsDeletedFalse(UUID id, UUID programId);

    long countByProgramIdAndIsDeletedFalse(UUID programId);
}
