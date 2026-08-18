package com.fecos.tanks;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tanks")
@RequiredArgsConstructor
public class TankController {

    private final TankService tankService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<Page<TankResponse>>> list(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TankStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Tanks retrieved", tankService.list(status, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<TankResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Tank retrieved", tankService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<TankResponse>> create(@Valid @RequestBody TankRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Tank created", tankService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<TankResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody TankRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Tank updated", tankService.update(id, req)));
    }

    @PatchMapping("/{id}/available")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> markAvailable(@PathVariable UUID id) {
        tankService.markAvailable(id);
        return ResponseEntity.ok(ApiResponse.ok("Tank marked available", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        tankService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Tank deleted", null));
    }

    @PostMapping("/{id}/events")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<TankResponse>> logEvent(
            @PathVariable UUID id, @Valid @RequestBody TankEventRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Event logged", tankService.logEvent(id, req)));
    }

    @GetMapping("/{id}/level")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<BigDecimal>> getLevel(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Level calculated", tankService.getCalculatedLevel(id)));
    }
}
