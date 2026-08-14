package com.fecos.masters;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductUnitRepository extends JpaRepository<ProductUnitEntity, UUID> {

    @Query("SELECT p FROM ProductUnitEntity p WHERE (p.tenantId IS NULL OR p.tenantId = :tenantId) AND p.isDeleted = false ORDER BY p.sortOrder ASC, p.name ASC")
    List<ProductUnitEntity> findForTenant(@Param("tenantId") UUID tenantId);

    @Query("SELECT p FROM ProductUnitEntity p WHERE LOWER(p.name) = LOWER(:name) AND p.tenantId IS NULL AND p.isDeleted = false")
    List<ProductUnitEntity> findGlobalByName(@Param("name") String name);

    @Query("SELECT p FROM ProductUnitEntity p WHERE LOWER(p.name) = LOWER(:name) AND p.tenantId = :tenantId AND p.isDeleted = false")
    List<ProductUnitEntity> findByNameAndTenant(@Param("name") String name, @Param("tenantId") UUID tenantId);

    @Query("SELECT p FROM ProductUnitEntity p WHERE LOWER(p.name) = LOWER(:name) AND p.tenantId IS NOT NULL AND p.isDeleted = false")
    List<ProductUnitEntity> findAllCustomByName(@Param("name") String name);

    Optional<ProductUnitEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
}
