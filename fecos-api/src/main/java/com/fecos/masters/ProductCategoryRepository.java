package com.fecos.masters;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductCategoryRepository extends JpaRepository<ProductCategoryEntity, UUID> {

    @Query("SELECT p FROM ProductCategoryEntity p WHERE (p.tenantId IS NULL OR p.tenantId = :tenantId) AND p.isDeleted = false ORDER BY p.sortOrder ASC, p.name ASC")
    List<ProductCategoryEntity> findForTenant(@Param("tenantId") UUID tenantId);

    @Query("SELECT p FROM ProductCategoryEntity p WHERE LOWER(p.name) = LOWER(:name) AND p.tenantId IS NULL AND p.isDeleted = false")
    List<ProductCategoryEntity> findGlobalByName(@Param("name") String name);

    @Query("SELECT p FROM ProductCategoryEntity p WHERE LOWER(p.name) = LOWER(:name) AND p.tenantId = :tenantId AND p.isDeleted = false")
    List<ProductCategoryEntity> findByNameAndTenant(@Param("name") String name, @Param("tenantId") UUID tenantId);

    @Query("SELECT p FROM ProductCategoryEntity p WHERE LOWER(p.name) = LOWER(:name) AND p.tenantId IS NOT NULL AND p.isDeleted = false")
    List<ProductCategoryEntity> findAllCustomByName(@Param("name") String name);

    Optional<ProductCategoryEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
}
