package com.fecos.clients;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends JpaRepository<ClientEntity, UUID> {

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
}
