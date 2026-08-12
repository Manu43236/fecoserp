package com.fecos.auth;

import com.fecos.config.JwtService;
import com.fecos.tenant.TenantContext;
import com.fecos.users.Role;
import com.fecos.users.UserEntity;
import com.fecos.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse login(AuthRequest request) {
        UUID tenantId = TenantContext.get();

        UserEntity user = findUser(request.getEmail(), tenantId);

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("email", user.getEmail());
        if (user.getTenantId() != null) {
            claims.put("tenantId", user.getTenantId().toString());
        }

        String token = jwtService.generate(user.getId().toString(), claims);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .tenantId(user.getTenantId() != null ? user.getTenantId().toString() : null)
                .build();
    }

    public AuthResponse me(String userId) {
        UserEntity user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        return AuthResponse.builder()
                .id(user.getId().toString())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .tenantId(user.getTenantId() != null ? user.getTenantId().toString() : null)
                .build();
    }

    private UserEntity findUser(String email, UUID tenantId) {
        // SUPER_ADMIN has no tenant
        if (tenantId == null) {
            return userRepository.findByEmailAndIsDeletedFalse(email)
                    .filter(u -> u.getRole() == Role.SUPER_ADMIN)
                    .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        }
        return userRepository.findByEmailAndTenantIdAndIsDeletedFalse(email, tenantId)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
    }
}
