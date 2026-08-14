package com.fecos.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WarehouseRepository extends JpaRepository<WarehouseEntity, UUID> {

    @Query("""
            SELECT w FROM WarehouseEntity w
            WHERE w.tenantId = :tenantId AND w.isDeleted = false
            AND (:search IS NULL OR LOWER(w.name) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY w.name ASC
            """)
    Page<WarehouseEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable);

    List<WarehouseEntity> findByTenantIdAndIsDeletedFalseAndIsActiveTrue(UUID tenantId);

    Optional<WarehouseEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    boolean existsByNameAndTenantIdAndIsDeletedFalse(String name, UUID tenantId);
}
