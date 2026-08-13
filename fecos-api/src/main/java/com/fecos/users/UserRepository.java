package com.fecos.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByMobileNumberAndIsDeletedFalse(String mobileNumber);

    Optional<UserEntity> findByMobileNumberAndTenantIdAndIsDeletedFalse(String mobileNumber, UUID tenantId);

    Optional<UserEntity> findFirstByTenantIdAndRoleAndIsDeletedFalse(UUID tenantId, Role role);

    boolean existsByMobileNumberAndTenantIdAndIsDeletedFalse(String mobileNumber, UUID tenantId);

    List<UserEntity> findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId);

    List<UserEntity> findAllByIsDeletedFalseOrderByCreatedAtDesc();
}
