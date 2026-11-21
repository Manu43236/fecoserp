package com.fecos.wells;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WellRepository extends JpaRepository<WellEntity, UUID> {

    // ── Account Rep coverage ───────────────────────────────────────────────────
    List<WellEntity> findAllByTenantIdAndAccountRepIdAndIsDeletedFalse(UUID tenantId, UUID accountRepId);

    @Modifying
    @Query("UPDATE WellEntity w SET w.accountRepId = NULL WHERE w.tenantId = :tenantId AND w.accountRepId = :repId")
    void clearAccountRep(@Param("tenantId") UUID tenantId, @Param("repId") UUID repId);

    @Modifying
    @Query("UPDATE WellEntity w SET w.accountRepId = :repId WHERE w.tenantId = :tenantId AND w.id IN :ids AND w.isDeleted = false")
    void assignAccountRep(@Param("tenantId") UUID tenantId, @Param("repId") UUID repId, @Param("ids") Collection<UUID> ids);

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

    List<WellEntity> findAllByTenantIdAndIsDeletedFalse(UUID tenantId);

    List<WellEntity> findAllByTenantIdAndLeaseIdInAndIsDeletedFalse(UUID tenantId, java.util.Collection<UUID> leaseIds);

    List<WellEntity> findAllByTenantIdAndLeaseIdAndIsDeletedFalse(UUID tenantId, UUID leaseId);

    Optional<WellEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByLeaseIdAndTenantIdAndIsDeletedFalse(UUID leaseId, UUID tenantId);

    long countByTenantIdAndIsDeletedFalse(UUID tenantId);

    @Query("SELECT w.id FROM WellEntity w WHERE w.tenantId = :tenantId AND w.leaseId IN :leaseIds AND w.isDeleted = false")
    List<UUID> findIdsByTenantIdAndLeaseIdIn(
            @Param("tenantId") UUID tenantId, @Param("leaseIds") java.util.Collection<UUID> leaseIds);

    long countByTenantIdAndLeaseIdInAndIsDeletedFalse(UUID tenantId, java.util.Collection<UUID> leaseIds);
}
