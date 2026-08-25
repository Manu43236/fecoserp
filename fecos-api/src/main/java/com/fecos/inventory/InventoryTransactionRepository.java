package com.fecos.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransactionEntity, UUID> {

    List<InventoryTransactionEntity> findByTenantIdAndReferenceIdAndReferenceTypeAndIsDeletedFalse(
            UUID tenantId, UUID referenceId, String referenceType);


    @Query("""
            SELECT t FROM InventoryTransactionEntity t
            WHERE t.tenantId = :tenantId AND t.isDeleted = false
            AND (:warehouseId IS NULL OR t.warehouseId = :warehouseId)
            AND (:type IS NULL OR t.type = :type)
            ORDER BY t.transactionDate DESC, t.createdAt DESC
            """)
    Page<InventoryTransactionEntity> search(
            @Param("tenantId") UUID tenantId,
            @Param("warehouseId") UUID warehouseId,
            @Param("type") InventoryTransactionType type,
            Pageable pageable);

    @Query("""
            SELECT t.warehouseId, t.productId, t.unit, SUM(t.quantity)
            FROM InventoryTransactionEntity t
            WHERE t.tenantId = :tenantId AND t.isDeleted = false
            AND (:warehouseId IS NULL OR t.warehouseId = :warehouseId)
            GROUP BY t.warehouseId, t.productId, t.unit
            HAVING SUM(t.quantity) != 0
            """)
    List<Object[]> stockSummary(
            @Param("tenantId") UUID tenantId,
            @Param("warehouseId") UUID warehouseId);
}
