package com.fecos.clients;

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

public interface ClientRepository extends JpaRepository<ClientEntity, UUID> {

    // ── Account Rep coverage ───────────────────────────────────────────────────
    List<ClientEntity> findAllByTenantIdAndAccountRepIdAndIsDeletedFalse(UUID tenantId, UUID accountRepId);

    @Modifying
    @Query("UPDATE ClientEntity c SET c.accountRepId = NULL WHERE c.tenantId = :tenantId AND c.accountRepId = :repId")
    void clearAccountRep(@Param("tenantId") UUID tenantId, @Param("repId") UUID repId);

    @Modifying
    @Query("UPDATE ClientEntity c SET c.accountRepId = :repId WHERE c.tenantId = :tenantId AND c.id IN :ids AND c.isDeleted = false")
    void assignAccountRep(@Param("tenantId") UUID tenantId, @Param("repId") UUID repId, @Param("ids") Collection<UUID> ids);

    @Query("""
        SELECT c FROM ClientEntity c
        WHERE c.tenantId = :tenantId
          AND c.isDeleted = false
          AND (:search IS NULL OR LOWER(c.companyName) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:accountRepId IS NULL OR c.accountRepId = :accountRepId)
          AND (:isActive IS NULL OR c.isActive = :isActive)
        ORDER BY c.companyName ASC
        """)
    Page<ClientEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            @Param("accountRepId") UUID accountRepId,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    Optional<ClientEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    boolean existsByCompanyNameAndTenantIdAndIsDeletedFalse(String companyName, UUID tenantId);

    Optional<ClientEntity> findByCompanyNameAndTenantIdAndIsDeletedFalse(String companyName, UUID tenantId);

    long countByTenantIdAndIsDeletedFalse(UUID tenantId);

    long countByTenantIdAndIsActiveAndIsDeletedFalse(UUID tenantId, boolean isActive);

    long countByTenantIdAndAccountRepIdAndIsDeletedFalse(UUID tenantId, UUID accountRepId);

    long countByTenantIdAndAccountRepIdAndIsActiveAndIsDeletedFalse(UUID tenantId, UUID accountRepId, boolean isActive);

    @Query("SELECT c.id FROM ClientEntity c WHERE c.tenantId = :tenantId AND c.accountRepId = :repId AND c.isDeleted = false")
    java.util.List<UUID> findIdsByTenantIdAndAccountRepId(
            @Param("tenantId") UUID tenantId, @Param("repId") UUID repId);

    @Query("SELECT COALESCE(MAX(c.refSeq), 0) FROM ClientEntity c WHERE c.tenantId = :tenantId")
    int maxRefSeq(@Param("tenantId") UUID tenantId);
}
