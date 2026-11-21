package com.fecos.yards;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface YardRepository extends JpaRepository<YardEntity, UUID> {

    @Query("""
            SELECT y FROM YardEntity y
            WHERE y.tenantId = :tenantId AND y.isDeleted = false
            AND (:search IS NULL OR LOWER(y.name) LIKE LOWER(CONCAT('%', :search, '%')))
            ORDER BY y.name ASC
            """)
    Page<YardEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("search") String search,
            Pageable pageable);

    List<YardEntity> findByTenantIdAndIsDeletedFalseAndIsActiveTrue(UUID tenantId);

    Optional<YardEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    boolean existsByNameAndTenantIdAndIsDeletedFalse(String name, UUID tenantId);
}
