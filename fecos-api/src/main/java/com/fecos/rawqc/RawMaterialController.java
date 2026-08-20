package com.fecos.rawqc;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/raw-qc")
@RequiredArgsConstructor
public class RawMaterialController {

    private final RawMaterialService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH','MANAGER')")
    public ResponseEntity<ApiResponse<Page<RawMaterialBatchResponse>>> list(
            @RequestParam(required = false) RawMaterialStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Batches retrieved", service.list(status, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH','MANAGER')")
    public ResponseEntity<ApiResponse<RawMaterialBatchResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Batch retrieved", service.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<RawMaterialBatchResponse>> create(
            @Valid @RequestBody RawMaterialBatchRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Batch logged", service.create(req)));
    }

    @PutMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<RawMaterialBatchResponse>> startTesting(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Testing started", service.startTesting(id)));
    }

    @PutMapping("/{id}/results")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<RawMaterialBatchResponse>> enterResults(
            @PathVariable UUID id, @Valid @RequestBody RawMaterialResultRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Results saved", service.enterResults(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Batch deleted", null));
    }
}
