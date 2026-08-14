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
@RequestMapping("/api/v1/masters/pump-types")
@RequiredArgsConstructor
public class PumpTypeController {

    private final PumpTypeService pumpTypeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<List<PumpTypeResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(pumpTypeService.list()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PumpTypeResponse>> create(@Valid @RequestBody PumpTypeRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(pumpTypeService.create(req)));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PumpTypeResponse>> toggle(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(pumpTypeService.toggleActive(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        pumpTypeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
