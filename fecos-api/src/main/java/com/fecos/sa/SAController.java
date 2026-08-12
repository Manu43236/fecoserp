package com.fecos.sa;

import com.fecos.auth.AuthResponse;
import com.fecos.auth.AuthService;
import com.fecos.common.ApiResponse;
import com.fecos.tenant.CreateTenantRequest;
import com.fecos.tenant.UpdateTenantRequest;
import com.fecos.tenant.TenantResponse;
import com.fecos.tenant.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sa")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SAController {

    private final TenantService tenantService;
    private final AuthService authService;

    @GetMapping("/tenants")
    public ResponseEntity<ApiResponse<List<TenantResponse>>> listTenants() {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.findAll()));
    }

    @PostMapping("/tenants")
    public ResponseEntity<ApiResponse<TenantResponse>> createTenant(@Valid @RequestBody CreateTenantRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.create(req)));
    }

    @PutMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<TenantResponse>> updateTenant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(tenantService.update(id, req)));
    }

    @DeleteMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTenant(@PathVariable UUID id) {
        tenantService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/tenants/{id}/impersonate")
    public ResponseEntity<ApiResponse<AuthResponse>> impersonate(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(authService.impersonateToken(id)));
    }
}
