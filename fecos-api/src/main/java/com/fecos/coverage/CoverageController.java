package com.fecos.coverage;

import com.fecos.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/coverage")
@RequiredArgsConstructor
public class CoverageController {

    private final CoverageService coverageService;

    @GetMapping("/{repId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CoverageResponse>> get(@PathVariable UUID repId) {
        return ResponseEntity.ok(ApiResponse.ok(coverageService.getCoverage(repId)));
    }

    @PutMapping("/{repId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> set(@PathVariable UUID repId, @RequestBody CoverageRequest req) {
        coverageService.setCoverage(repId, req);
        return ResponseEntity.ok(ApiResponse.ok("Coverage updated", null));
    }

    @GetMapping("/client/{clientId}/tree")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ClientTreeResponse>> clientTree(@PathVariable UUID clientId) {
        return ResponseEntity.ok(ApiResponse.ok(coverageService.getClientTree(clientId)));
    }
}
