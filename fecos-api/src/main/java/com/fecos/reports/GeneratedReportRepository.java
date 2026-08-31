package com.fecos.reports;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GeneratedReportRepository extends JpaRepository<GeneratedReportEntity, UUID> {

    Page<GeneratedReportEntity> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Optional<GeneratedReportEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
}
