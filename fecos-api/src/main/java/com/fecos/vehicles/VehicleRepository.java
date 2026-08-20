package com.fecos.vehicles;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface VehicleRepository extends JpaRepository<VehicleEntity, UUID> {

    Page<VehicleEntity> findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    Page<VehicleEntity> findAllByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, VehicleStatus status, Pageable pageable);

    Page<VehicleEntity> findAllByTenantIdAndVehicleTypeAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, VehicleType vehicleType, Pageable pageable);

    Page<VehicleEntity> findAllByTenantIdAndVehicleTypeAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId, VehicleType vehicleType, VehicleStatus status, Pageable pageable);

    @Query("SELECT v FROM VehicleEntity v WHERE v.tenantId = :tenantId AND v.isDeleted = false AND " +
           "(LOWER(v.make) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(v.model) LIKE LOWER(CONCAT('%',:q,'%')) OR LOWER(v.licensePlate) LIKE LOWER(CONCAT('%',:q,'%')))")
    Page<VehicleEntity> search(@Param("tenantId") UUID tenantId, @Param("q") String q, Pageable pageable);

    Optional<VehicleEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);
}
