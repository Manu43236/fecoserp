package com.fecos.auth;

import com.fecos.config.JwtService;
import com.fecos.tenant.TenantContext;
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
        if (tenantId == null) {
            throw new BadCredentialsException("Unknown tenant");
        }

        UserEntity user = userRepository
                .findByMobileNumberAndTenantIdAndIsDeletedFalse(request.getMobileNumber(), tenantId)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPin(), user.getPinHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtService.generate(
                user.getId().toString(),
                Map.of(
                        "role", user.getRole().name(),
                        "tenantId", tenantId.toString(),
                        "mobile", user.getMobileNumber()
                )
        );

        return AuthResponse.builder()
                .token(token)
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .mobile(user.getMobileNumber())
                .build();
    }
}
