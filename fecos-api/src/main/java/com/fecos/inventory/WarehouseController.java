package com.fecos.inventory;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<Page<WarehouseResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.list(search, page, size)));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.listActive()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(@Valid @RequestBody WarehouseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody WarehouseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        warehouseService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
