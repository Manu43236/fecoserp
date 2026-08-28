package com.fecos.lab;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lab")
@RequiredArgsConstructor
public class LabController {

    private final LabService labService;
    private final LabPdfService labPdfService;

    @GetMapping("/samples")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH','ACCOUNT_REP','MANAGER')")
    public ResponseEntity<ApiResponse<Page<LabSampleResponse>>> list(
            @RequestParam(required = false) LabSampleStatus status,
            @RequestParam(required = false) UUID wellId,
            @RequestParam(required = false) SampleType sampleType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTo,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Samples retrieved",
                labService.list(status, wellId, sampleType, dateFrom, dateTo, page, size)));
    }

    @GetMapping("/samples/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH','ACCOUNT_REP','MANAGER')")
    public ResponseEntity<ApiResponse<LabSampleResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Sample retrieved", labService.findById(id)));
    }

    @PostMapping("/samples")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<LabSampleResponse>> create(@Valid @RequestBody LabSampleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Sample logged", labService.create(req)));
    }

    @PutMapping("/samples/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<LabSampleResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody LabSampleRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Sample updated", labService.update(id, req)));
    }

    @PostMapping("/samples/{id}/results")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<LabSampleResponse>> enterResults(
            @PathVariable UUID id, @RequestBody LabResultRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Results saved", labService.enterResults(id, req)));
    }

    @PutMapping("/samples/{id}/results")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH')")
    public ResponseEntity<ApiResponse<LabSampleResponse>> updateResults(
            @PathVariable UUID id, @RequestBody LabResultRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Results updated", labService.enterResults(id, req)));
    }

    @GetMapping("/pending-approvals")
    @PreAuthorize("hasAnyRole('ADMIN','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<Page<LabSampleResponse>>> pendingApprovals(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Pending approvals retrieved",
                labService.getPendingApprovals(page, size)));
    }

    @PostMapping("/samples/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<LabSampleResponse>> approve(
            @PathVariable UUID id, @RequestBody LabApproveRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Result approved", labService.approve(id, req)));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH','ACCOUNT_REP','MANAGER')")
    public ResponseEntity<ApiResponse<Page<LabSampleResponse>>> alerts(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Alerts retrieved", labService.getAlerts(page, size)));
    }

    @GetMapping("/samples/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','LAB_TECH','ACCOUNT_REP','MANAGER')")
    public ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
        var sample = labService.findById(id);
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "lab-report.pdf");
        return ResponseEntity.ok().headers(headers).body(labPdfService.generate(sample));
    }
}
