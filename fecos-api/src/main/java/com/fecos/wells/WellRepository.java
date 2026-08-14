package com.fecos.wells;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WellRepository extends JpaRepository<WellEntity, UUID> {

    @Query("""
        SELECT w FROM WellEntity w
        WHERE w.tenantId = :tenantId
          AND w.isDeleted = false
          AND (:search IS NULL OR LOWER(w.wellName) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:leaseId IS NULL OR w.leaseId = :leaseId)
          AND (:isActive IS NULL OR w.isActive = :isActive)
        ORDER BY w.wellName ASC
        """)
    Page<WellEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            @Param("leaseId") UUID leaseId,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    List<WellEntity> findAllByTenantIdAndLeaseIdAndIsDeletedFalse(UUID tenantId, UUID leaseId);

    Optional<WellEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByLeaseIdAndTenantIdAndIsDeletedFalse(UUID leaseId, UUID tenantId);
}
