package com.fecos.finishedqc;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finished-qc")
@RequiredArgsConstructor
public class FinishedProductController {

    private final FinishedProductService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH','MANAGER')")
    public ResponseEntity<ApiResponse<Page<FinishedProductBatchResponse>>> list(
            @RequestParam(required = false) FinishedProductStatus status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Batches retrieved", service.list(status, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH','MANAGER')")
    public ResponseEntity<ApiResponse<FinishedProductBatchResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Batch retrieved", service.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<FinishedProductBatchResponse>> create(
            @Valid @RequestBody FinishedProductBatchRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Batch logged", service.create(req)));
    }

    @PutMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<FinishedProductBatchResponse>> startTesting(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Testing started", service.startTesting(id)));
    }

    @PutMapping("/{id}/results")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<FinishedProductBatchResponse>> enterResults(
            @PathVariable UUID id, @Valid @RequestBody FinishedProductResultRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Results saved", service.enterResults(id, req)));
    }

    @PutMapping("/{id}/move-to-warehouse")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<FinishedProductBatchResponse>> moveToWarehouse(
            @PathVariable UUID id, @Valid @RequestBody MoveToWarehouseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Moved to warehouse", service.moveToWarehouse(id, req)));
    }
}
