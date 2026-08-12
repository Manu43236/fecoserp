package com.fecos.tenant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {
    Optional<TenantEntity> findBySubdomainAndIsDeletedFalse(String subdomain);
    Optional<TenantEntity> findByIdAndIsDeletedFalse(UUID id);
    List<TenantEntity> findAllByIsDeletedFalseOrderByCompanyNameAsc();
    boolean existsBySubdomainAndIsDeletedFalse(String subdomain);
}
