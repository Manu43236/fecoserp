package com.fecos.masters;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/masters/product-units")
@RequiredArgsConstructor
public class ProductUnitController {

    private final ProductUnitService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<List<ProductUnitResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.list()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductUnitResponse>> create(@Valid @RequestBody PumpTypeRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(req)));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductUnitResponse>> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.toggleActive(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
