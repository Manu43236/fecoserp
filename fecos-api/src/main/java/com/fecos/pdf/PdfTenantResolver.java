package com.fecos.pdf;

import com.fecos.tenant.TenantEntity;
import com.fecos.tenant.TenantRepository;
import com.fecos.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PdfTenantResolver {

    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;

    public TenantEntity current() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepo.findById(UUID.fromString(userId)).orElse(null);
        if (user == null) return null;
        return tenantRepo.findByIdAndIsDeletedFalse(user.getTenantId()).orElse(null);
    }
}
