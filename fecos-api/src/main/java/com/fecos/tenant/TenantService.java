package com.fecos.tenant;

import com.fecos.users.Role;
import com.fecos.users.UserEntity;
import com.fecos.users.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public boolean subdomainExists(String subdomain) {
        return tenantRepository.existsBySubdomainAndIsDeletedFalse(subdomain);
    }

    public TenantEntity findBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomainAndIsDeletedFalse(subdomain)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found: " + subdomain));
    }

    public List<TenantResponse> findAll() {
        return tenantRepository.findAllByIsDeletedFalseOrderByCompanyNameAsc()
                .stream().map(TenantResponse::from).toList();
    }

    @Transactional
    public TenantResponse create(CreateTenantRequest req) {
        if (tenantRepository.existsBySubdomainAndIsDeletedFalse(req.getSubdomain()))
            throw new IllegalArgumentException("Subdomain already in use: " + req.getSubdomain());

        TenantEntity tenant = new TenantEntity();
        tenant.setCompanyName(req.getCompanyName());
        tenant.setSubdomain(req.getSubdomain());
        tenant.setOwnerName(req.getOwnerName());
        tenant.setContactPhone(req.getContactPhone());
        tenant.setContactEmail(req.getContactEmail());
        tenant.setPrimaryColor(req.getPrimaryColor() != null ? req.getPrimaryColor() : "#751903");
        tenant.setDarkColor(req.getDarkColor() != null ? req.getDarkColor() : "#3F0C00");
        tenant.setAccentColor(req.getAccentColor() != null ? req.getAccentColor() : "#E5D4CF");
        tenant.setPlan(req.getPlan() != null ? TenantPlan.valueOf(req.getPlan()) : TenantPlan.PILOT);
        tenant.setActive(true);
        tenant = tenantRepository.save(tenant);

        // Seed initial ADMIN user
        if (userRepository.existsByMobileNumberAndTenantIdAndIsDeletedFalse(req.getAdminMobileNumber(), tenant.getId()))
            throw new IllegalArgumentException("Mobile number already registered for this tenant");

        UserEntity admin = new UserEntity();
        admin.setTenantId(tenant.getId());
        admin.setFullName(req.getAdminFullName());
        admin.setMobileNumber(req.getAdminMobileNumber());
        admin.setPinHash(passwordEncoder.encode(req.getAdminPin()));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        userRepository.save(admin);

        return TenantResponse.from(tenant);
    }

    @Transactional
    public TenantResponse update(UUID id, UpdateTenantRequest req) {
        TenantEntity tenant = tenantRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));

        tenant.setCompanyName(req.getCompanyName());
        tenant.setOwnerName(req.getOwnerName());
        tenant.setContactPhone(req.getContactPhone());
        tenant.setContactEmail(req.getContactEmail());
        if (req.getPrimaryColor() != null) tenant.setPrimaryColor(req.getPrimaryColor());
        if (req.getDarkColor() != null) tenant.setDarkColor(req.getDarkColor());
        if (req.getAccentColor() != null) tenant.setAccentColor(req.getAccentColor());
        if (req.getPlan() != null) tenant.setPlan(TenantPlan.valueOf(req.getPlan()));
        if (req.getLogoUrl() != null) tenant.setLogoUrl(req.getLogoUrl());

        return TenantResponse.from(tenantRepository.save(tenant));
    }

    @Transactional
    public void deactivate(UUID id) {
        TenantEntity tenant = tenantRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));
        tenant.setDeleted(true);
        tenantRepository.save(tenant);
    }
}
