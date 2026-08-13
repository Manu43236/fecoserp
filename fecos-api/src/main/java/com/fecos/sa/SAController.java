package com.fecos.sa;

import com.fecos.auth.AuthResponse;
import com.fecos.auth.AuthService;
import com.fecos.common.ApiResponse;
import com.fecos.tenant.CreateTenantRequest;
import com.fecos.tenant.TenantRepository;
import com.fecos.tenant.UpdateTenantRequest;
import com.fecos.tenant.TenantResponse;
import com.fecos.tenant.TenantService;
import com.fecos.users.SACreateUserRequest;
import com.fecos.users.SAUserResponse;
import com.fecos.users.UpdateUserRequest;
import com.fecos.users.UserRepository;
import com.fecos.users.UserResponse;
import com.fecos.users.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sa")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SAController {

    private final TenantService tenantService;
    private final TenantRepository tenantRepository;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserService userService;

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

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<SAUserResponse>>> listUsers(
            @RequestParam(required = false) UUID tenantId) {
        Map<UUID, String> tenantNames = new HashMap<>();
        tenantRepository.findAllByIsDeletedFalseOrderByCompanyNameAsc()
                .forEach(t -> tenantNames.put(t.getId(), t.getCompanyName() != null ? t.getCompanyName() : "—"));

        List<SAUserResponse> users = (tenantId != null
                ? userRepository.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId)
                : userRepository.findAllByIsDeletedFalseOrderByCreatedAtDesc())
                .stream().map(u -> SAUserResponse.from(u, tenantNames)).toList();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody SACreateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(userService.createForTenant(req)));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(userService.updateById(id, req)));
    }

    @PostMapping("/tenants/{id}/impersonate")
    public ResponseEntity<ApiResponse<AuthResponse>> impersonate(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(authService.impersonateToken(id)));
    }
}
