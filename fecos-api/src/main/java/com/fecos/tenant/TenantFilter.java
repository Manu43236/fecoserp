package com.fecos.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class TenantFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        try {
            // Header takes priority — web app sends its subdomain since Host is api.fecoserp.com
            String subdomain = request.getHeader("X-Tenant-Subdomain");
            if (subdomain == null) {
                subdomain = extractSubdomain(request.getServerName());
            }
            if (subdomain != null) {
                tenantRepository.findBySubdomainAndIsDeletedFalse(subdomain)
                        .ifPresent(t -> TenantContext.set(t.getId()));
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private String extractSubdomain(String host) {
        // e.g. endura.fecoserp.com → "endura"; localhost → null
        if (host == null || host.startsWith("localhost") || host.startsWith("127.")) {
            return null;
        }
        String[] parts = host.split("\\.");
        return parts.length >= 3 ? parts[0] : null;
    }
}
