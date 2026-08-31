package com.fecos.reports;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reports/general")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','OFFICE_STAFF')")
public class GeneralReportController {

    private final GeneralReportService service;

    @GetMapping("/service-visits")
    public ResponseEntity<byte[]> serviceVisits(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "excel") String format) {
        var tenantId = service.currentTenantId();
        return "pdf".equalsIgnoreCase(format)
                ? pdf(service.serviceVisitsPdf(tenantId, from, to), "service-visits.pdf")
                : excel(service.serviceVisitsExcel(tenantId, from, to), "service-visits.xlsx");
    }

    @GetMapping("/deliveries")
    public ResponseEntity<byte[]> deliveries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "excel") String format) {
        var tenantId = service.currentTenantId();
        return "pdf".equalsIgnoreCase(format)
                ? pdf(service.deliveriesPdf(tenantId, from, to), "deliveries.pdf")
                : excel(service.deliveriesExcel(tenantId, from, to), "deliveries.xlsx");
    }

    @GetMapping("/lab-results")
    public ResponseEntity<byte[]> labResults(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "excel") String format) {
        var tenantId = service.currentTenantId();
        return "pdf".equalsIgnoreCase(format)
                ? pdf(service.labResultsPdf(tenantId, from, to), "lab-results.pdf")
                : excel(service.labResultsExcel(tenantId, from, to), "lab-results.xlsx");
    }

    @GetMapping("/field-activity")
    public ResponseEntity<byte[]> fieldActivity(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "excel") String format) {
        var tenantId = service.currentTenantId();
        return "pdf".equalsIgnoreCase(format)
                ? pdf(service.fieldActivityPdf(tenantId, from, to), "field-activity.pdf")
                : excel(service.fieldActivityExcel(tenantId, from, to), "field-activity.xlsx");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ResponseEntity<byte[]> excel(byte[] bytes, String filename) {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private ResponseEntity<byte[]> pdf(byte[] bytes, String filename) {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}
