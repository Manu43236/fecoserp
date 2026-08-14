package com.fecos.leases;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaseRepository extends JpaRepository<LeaseEntity, UUID> {

    @Query("""
        SELECT l FROM LeaseEntity l
        WHERE l.tenantId = :tenantId
          AND l.isDeleted = false
          AND (:search IS NULL OR LOWER(l.leaseName) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:clientId IS NULL OR l.clientId = :clientId)
          AND (:isActive IS NULL OR l.isActive = :isActive)
        ORDER BY l.leaseName ASC
        """)
    Page<LeaseEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            @Param("clientId") UUID clientId,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    List<LeaseEntity> findAllByTenantIdAndClientIdAndIsDeletedFalse(UUID tenantId, UUID clientId);

    Optional<LeaseEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    boolean existsByLeaseNameAndClientIdAndTenantIdAndIsDeletedFalse(String leaseName, UUID clientId, UUID tenantId);
}
