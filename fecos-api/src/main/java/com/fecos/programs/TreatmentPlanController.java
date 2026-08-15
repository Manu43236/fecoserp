package com.fecos.programs;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/plans")
@RequiredArgsConstructor
public class TreatmentPlanController {

    private final TreatmentPlanService planService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<Page<TreatmentPlanResponse>>> list(
            @RequestParam(required = false) TreatmentPlanStatus status,
            @RequestParam(required = false) UUID wellId,
            @RequestParam(required = false) UUID accountRepId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Plans retrieved",
                planService.list(status, wellId, accountRepId, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Plan retrieved", planService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> create(@Valid @RequestBody TreatmentPlanRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Plan created", planService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody TreatmentPlanRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Plan updated", planService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        planService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Plan deleted", null));
    }

    @PostMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> addLine(
            @PathVariable UUID id, @Valid @RequestBody TreatmentPlanLineRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Line added", planService.addLine(id, req)));
    }

    @PutMapping("/{id}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<TreatmentPlanResponse>> updateLine(
            @PathVariable UUID id, @PathVariable UUID lineId, @Valid @RequestBody TreatmentPlanLineRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Line updated", planService.updateLine(id, lineId, req)));
    }

    @DeleteMapping("/{id}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<Void>> removeLine(@PathVariable UUID id, @PathVariable UUID lineId) {
        planService.removeLine(id, lineId);
        return ResponseEntity.ok(ApiResponse.ok("Line removed", null));
    }
}
