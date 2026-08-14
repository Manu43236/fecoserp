package com.fecos.wells;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wells")
@RequiredArgsConstructor
public class WellController {

    private final WellService wellService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<Page<WellResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID leaseId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Wells retrieved",
                wellService.list(search, leaseId, isActive, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<WellResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Well retrieved", wellService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WellResponse>> create(@Valid @RequestBody WellRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Well created", wellService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WellResponse>> update(@PathVariable UUID id, @Valid @RequestBody WellRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Well updated", wellService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        wellService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Well deleted", null));
    }
}
