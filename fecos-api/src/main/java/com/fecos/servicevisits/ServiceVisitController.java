package com.fecos.servicevisits;

import com.fecos.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/service-visits")
@RequiredArgsConstructor
public class ServiceVisitController {

    private final ServiceVisitService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<Page<ServiceVisitResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) ServiceVisitStatus status,
            @RequestParam(required = false) UUID techId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(page, size, status, techId, dateFrom, dateTo)));
    }

    @GetMapping("/due-wells")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<DueWellResponse>>> dueWells(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(service.getDueWells(date)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<ServiceVisitResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.get(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ServiceVisitResponse>> create(@RequestBody ServiceVisitRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ServiceVisitResponse>> update(
            @PathVariable UUID id, @RequestBody ServiceVisitUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, req)));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','SERVICE_TECH')")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable UUID id, @RequestBody ServiceVisitUpdateRequest req) {
        service.updateStatus(id, req.status());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/{id}/stops")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ServiceVisitResponse>> addStop(
            @PathVariable UUID id, @RequestBody ServiceVisitStopRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.addStop(id, req)));
    }

    @PutMapping("/{id}/stops/{stopId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ServiceVisitResponse>> updateStop(
            @PathVariable UUID id, @PathVariable UUID stopId,
            @RequestBody ServiceVisitStopUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateStop(id, stopId, req)));
    }

    @DeleteMapping("/{id}/stops/{stopId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<ServiceVisitResponse>> removeStop(
            @PathVariable UUID id, @PathVariable UUID stopId) {
        return ResponseEntity.ok(ApiResponse.ok(service.removeStop(id, stopId)));
    }
}
