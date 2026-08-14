package com.fecos.leases;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leases")
@RequiredArgsConstructor
public class LeaseController {

    private final LeaseService leaseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<Page<LeaseResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Leases retrieved",
                leaseService.list(search, clientId, isActive, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<LeaseResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Lease retrieved", leaseService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LeaseResponse>> create(@Valid @RequestBody LeaseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Lease created", leaseService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LeaseResponse>> update(@PathVariable UUID id, @Valid @RequestBody LeaseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Lease updated", leaseService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        leaseService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Lease deleted", null));
    }
}
