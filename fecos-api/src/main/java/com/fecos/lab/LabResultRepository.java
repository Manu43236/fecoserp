package com.fecos.lab;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LabResultRepository extends JpaRepository<LabResultEntity, UUID> {

    Optional<LabResultEntity> findBySampleIdAndIsDeletedFalse(UUID sampleId);

    Page<LabResultEntity> findAllByTenantIdAndHasCriticalValuesTrueAndIsDeletedFalseOrderByCreatedAtDesc(
            UUID tenantId, Pageable pageable);

    Page<LabResultEntity> findAllByTenantIdAndApprovalStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            UUID tenantId, ApprovalStatus approvalStatus, Pageable pageable);
}
