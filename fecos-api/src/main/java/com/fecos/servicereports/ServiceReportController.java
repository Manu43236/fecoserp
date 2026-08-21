package com.fecos.servicereports;

import com.fecos.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ServiceReportController {

    private final ServiceReportService service;

    // Mobile — service tech dashboard summary for today
    @GetMapping("/api/v1/service-tech/dashboard")
    @PreAuthorize("hasRole('SERVICE_TECH')")
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.ok(service.dashboard()));
    }

    // Mobile — service tech gets their visits for today
    @GetMapping("/api/v1/my-visits")
    @PreAuthorize("hasRole('SERVICE_TECH')")
    public ResponseEntity<ApiResponse<List<MyVisitResponse>>> myVisits(
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(ApiResponse.ok(service.myVisits(date)));
    }

    // Mobile — submit service report for a stop
    @PostMapping("/api/v1/service-visits/{visitId}/stops/{stopId}/report")
    @PreAuthorize("hasRole('SERVICE_TECH')")
    public ResponseEntity<ApiResponse<ServiceReportResponse>> submit(
            @PathVariable UUID visitId,
            @PathVariable UUID stopId,
            @RequestBody ServiceReportRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.submit(visitId, stopId, req)));
    }

    // Mobile — get existing report for a stop
    @GetMapping("/api/v1/service-visits/{visitId}/stops/{stopId}/report")
    @PreAuthorize("hasAnyRole('SERVICE_TECH','ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<ServiceReportResponse>> getByStop(
            @PathVariable UUID visitId,
            @PathVariable UUID stopId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getByStop(stopId)));
    }

    // Web — admin/manager view all reports
    @GetMapping("/api/v1/service-reports")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<Page<ServiceReportResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(page, size)));
    }
}
