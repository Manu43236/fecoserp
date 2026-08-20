package com.fecos.pumpshop;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pumps")
@RequiredArgsConstructor
public class PumpController {

    private final PumpService pumpService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<Page<PumpResponse>>> list(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) PumpStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Pumps retrieved", pumpService.list(status, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<PumpResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Pump retrieved", pumpService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PumpResponse>> create(@Valid @RequestBody PumpRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Pump created", pumpService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PumpResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody PumpRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Pump updated", pumpService.update(id, req)));
    }

    @PatchMapping("/{id}/deploy")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PumpResponse>> deploy(
            @PathVariable UUID id, @Valid @RequestBody DeployRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Pump deployed", pumpService.deploy(id, req)));
    }

    @PatchMapping("/{id}/pull")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PumpResponse>> pull(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Pump pulled", pumpService.pull(id)));
    }

    @PatchMapping("/{id}/repair")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PumpResponse>> sendToRepair(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Pump sent to repair", pumpService.sendToRepair(id)));
    }

    @PostMapping("/{id}/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PumpResponse>> logMaintenance(
            @PathVariable UUID id, @Valid @RequestBody PumpMaintenanceRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Maintenance logged", pumpService.logMaintenance(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        pumpService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Pump deleted", null));
    }
}
