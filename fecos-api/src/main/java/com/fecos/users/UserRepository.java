package com.fecos.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByMobileNumberAndIsDeletedFalse(String mobileNumber);

    Optional<UserEntity> findByMobileNumberAndTenantIdAndIsDeletedFalse(String mobileNumber, UUID tenantId);

    boolean existsByMobileNumberAndTenantIdAndIsDeletedFalse(String mobileNumber, UUID tenantId);

    List<UserEntity> findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId);

    List<UserEntity> findAllByIsDeletedFalseOrderByCreatedAtDesc();

    /** Users in a tenant who hold the given role (matches any of their roles), by name. */
    @Query("SELECT u FROM UserEntity u WHERE u.tenantId = :tenantId AND u.isDeleted = false "
            + "AND :role MEMBER OF u.roles ORDER BY u.fullName ASC")
    List<UserEntity> findAllByTenantIdAndRole(@Param("tenantId") UUID tenantId, @Param("role") Role role);

    /** Users in a tenant who hold the given role, oldest first (for picking a default admin). */
    @Query("SELECT u FROM UserEntity u WHERE u.tenantId = :tenantId AND u.isDeleted = false "
            + "AND :role MEMBER OF u.roles ORDER BY u.createdAt ASC")
    List<UserEntity> findByTenantIdAndRoleOrderByCreatedAt(@Param("tenantId") UUID tenantId, @Param("role") Role role);
}
