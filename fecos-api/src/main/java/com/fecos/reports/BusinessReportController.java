package com.fecos.reports;

import com.fecos.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports/business")
@RequiredArgsConstructor
public class BusinessReportController {

    private final BusinessReportService service;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<GeneratedReportResponse>> generate(@RequestBody GenerateReportRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Report created", service.create(req)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','OFFICE_STAFF')")
    public ResponseEntity<ApiResponse<Page<GeneratedReportResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(page, size)));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<byte[]> download(@PathVariable UUID id) {
        var bytes   = service.download(id);
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "report.pdf");
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @PutMapping("/{id}/mark-sent")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<GeneratedReportResponse>> markSent(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Marked as sent", service.markSent(id)));
    }
}
