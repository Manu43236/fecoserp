package com.fecos.auth;

import com.fecos.config.JwtService;
import com.fecos.tenant.TenantContext;
import com.fecos.tenant.TenantEntity;
import com.fecos.tenant.TenantRepository;
import com.fecos.users.Role;
import com.fecos.users.UserEntity;
import com.fecos.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse login(AuthRequest request) {
        UUID tenantId = TenantContext.get();
        UserEntity user = findUser(request.getMobileNumber(), tenantId);

        if (!user.isActive()) throw new BadCredentialsException("Account is disabled");
        if (!passwordEncoder.matches(request.getPin(), user.getPinHash()))
            throw new BadCredentialsException("Invalid credentials");

        return buildResponse(user, generateToken(user));
    }

    public AuthResponse me(String userId) {
        UserEntity user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        return buildResponse(user, null);
    }

    // Called by SAController — generates a tenant-ADMIN token without password check
    public AuthResponse impersonateToken(UUID tenantId) {
        if (!tenantRepository.findByIdAndIsDeletedFalse(tenantId).isPresent())
            throw new BadCredentialsException("Tenant not found");

        UserEntity admin = userRepository.findFirstByTenantIdAndRoleAndIsDeletedFalse(tenantId, Role.ADMIN)
                .orElseThrow(() -> new IllegalStateException("No ADMIN user found for tenant"));

        return buildResponse(admin, generateToken(admin));
    }

    private String generateToken(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        if (user.getMobileNumber() != null) claims.put("mobileNumber", user.getMobileNumber());
        if (user.getTenantId() != null) claims.put("tenantId", user.getTenantId().toString());
        return jwtService.generate(user.getId().toString(), claims);
    }

    private AuthResponse buildResponse(UserEntity user, String token) {
        String tenantName = null;
        String primaryColor = null, darkColor = null, accentColor = null;
        if (user.getTenantId() != null) {
            TenantEntity tenant = tenantRepository.findByIdAndIsDeletedFalse(user.getTenantId()).orElse(null);
            if (tenant != null) {
                tenantName    = tenant.getCompanyName();
                primaryColor  = tenant.getPrimaryColor();
                darkColor     = tenant.getDarkColor();
                accentColor   = tenant.getAccentColor();
            }
        }
        return AuthResponse.builder()
                .token(token)
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .tenantId(user.getTenantId() != null ? user.getTenantId().toString() : null)
                .tenantName(tenantName)
                .primaryColor(primaryColor)
                .darkColor(darkColor)
                .accentColor(accentColor)
                .build();
    }

    private UserEntity findUser(String mobileNumber, UUID tenantId) {
        if (tenantId != null) {
            return userRepository.findByMobileNumberAndTenantIdAndIsDeletedFalse(mobileNumber, tenantId)
                    .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        }
        // No subdomain context — production never reaches here (each client has its own subdomain).
        // On localhost, fall back to searching all tenants so dev login works without a subdomain field.
        return userRepository.findByMobileNumberAndIsDeletedFalse(mobileNumber)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
    }
}
