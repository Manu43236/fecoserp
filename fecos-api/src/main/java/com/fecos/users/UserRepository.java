package com.fecos.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    Optional<UserEntity> findByEmailAndIsDeletedFalse(String email);

    Optional<UserEntity> findByEmailAndTenantIdAndIsDeletedFalse(String email, UUID tenantId);

    Optional<UserEntity> findByMobileNumberAndTenantIdAndIsDeletedFalse(String mobileNumber, UUID tenantId);
}
