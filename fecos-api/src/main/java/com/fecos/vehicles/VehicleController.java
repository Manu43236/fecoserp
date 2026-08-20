package com.fecos.vehicles;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Page<VehicleResponse>>> list(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) VehicleType type,
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok("Vehicles retrieved", vehicleService.list(type, status, search, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<VehicleResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Vehicle retrieved", vehicleService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VehicleResponse>> create(@Valid @RequestBody VehicleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Vehicle created", vehicleService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VehicleResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody VehicleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Vehicle updated", vehicleService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        vehicleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Vehicle deleted", null));
    }
}
