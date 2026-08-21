package com.fecos.tenant;

import com.fecos.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tenant")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<TenantConfigResponse>> getConfig(HttpServletRequest request) {
        String subdomain = request.getHeader("X-Tenant-Subdomain");
        if (subdomain == null) subdomain = extractSubdomain(request.getServerName());
        TenantEntity tenant = tenantService.findBySubdomain(subdomain != null ? subdomain : "endura");

        TenantConfigResponse config = TenantConfigResponse.builder()
                .companyName(tenant.getCompanyName())
                .logoUrl(tenant.getLogoUrl())
                .faviconUrl(tenant.getFaviconUrl())
                .primaryColor(tenant.getPrimaryColor())
                .darkColor(tenant.getDarkColor())
                .accentColor(tenant.getAccentColor())
                .plan(tenant.getPlan().name())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(config));
    }

    @GetMapping("/check-subdomain")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkSubdomain(@RequestParam String value) {
        boolean available = !tenantService.subdomainExists(value);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("available", available)));
    }

    private String extractSubdomain(String host) {
        if (host == null || host.startsWith("localhost") || host.startsWith("127.")) {
            return null;
        }
        String[] parts = host.split("\\.");
        return parts.length >= 3 ? parts[0] : null;
    }
}
