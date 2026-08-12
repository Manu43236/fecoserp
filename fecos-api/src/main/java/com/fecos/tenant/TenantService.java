package com.fecos.tenant;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantEntity findBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomainAndIsDeletedFalse(subdomain)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found: " + subdomain));
    }
}
