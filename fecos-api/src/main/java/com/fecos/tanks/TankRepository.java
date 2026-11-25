package com.fecos.tanks;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TankRepository extends JpaRepository<TankEntity, UUID> {

    Page<TankEntity> findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<TankEntity> findAllByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, TankStatus status, Pageable pageable);

    @Query("SELECT t FROM TankEntity t WHERE t.tenantId = :tenantId AND t.isDeleted = false "
            + "AND (:status IS NULL OR t.status = :status) "
            + "AND (:owner IS NULL OR t.owner = :owner) "
            + "ORDER BY t.createdAt DESC")
    Page<TankEntity> search(@Param("tenantId") UUID tenantId,
                            @Param("status") TankStatus status,
                            @Param("owner") TankOwner owner,
                            Pageable pageable);

    List<TankEntity> findAllByTenantIdAndWellIdAndIsDeletedFalse(UUID tenantId, UUID wellId);

    Optional<TankEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    long countByTenantIdAndIsDeletedFalse(UUID tenantId);

    List<TankEntity> findAllByTenantIdAndStatusAndIsDeletedFalse(UUID tenantId, TankStatus status);

    List<TankEntity> findAllByTenantIdAndStatusInAndIsDeletedFalse(
            UUID tenantId, java.util.Collection<TankStatus> statuses);

    List<TankEntity> findAllByTenantIdAndWellIdInAndStatusAndIsDeletedFalse(
            UUID tenantId, java.util.Collection<UUID> wellIds, TankStatus status);

    List<TankEntity> findAllByTenantIdAndWellIdInAndStatusInAndIsDeletedFalse(
            UUID tenantId, java.util.Collection<UUID> wellIds, java.util.Collection<TankStatus> statuses);

    @Query("SELECT COALESCE(MAX(t.refSeq), 0) FROM TankEntity t WHERE t.tenantId = :tenantId")
    int maxRefSeq(@Param("tenantId") UUID tenantId);
}
