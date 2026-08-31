package com.fecos.products;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<ProductEntity, UUID> {

    @Query("""
            SELECT p FROM ProductEntity p
            WHERE p.tenantId = :tenantId AND p.isDeleted = false
            AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(p.productCode) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:category IS NULL OR p.category = :category)
            AND (:isActive IS NULL OR p.isActive = :isActive)
            ORDER BY p.category ASC, p.name ASC
            """)
    Page<ProductEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            @Param("category") String category,
            @Param("isActive") Boolean isActive,
            Pageable pageable);

    Optional<ProductEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    java.util.List<ProductEntity> findAllByTenantIdAndIsDeletedFalse(UUID tenantId);

    boolean existsByNameAndTenantIdAndIsDeletedFalse(String name, UUID tenantId);
}
