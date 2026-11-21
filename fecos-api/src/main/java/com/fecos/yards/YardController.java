package com.fecos.yards;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/yards")
@RequiredArgsConstructor
public class YardController {

    private final YardService yardService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<Page<YardResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(yardService.list(search, page, size)));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<List<YardResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.ok(yardService.listActive()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<YardResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(yardService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<YardResponse>> create(@Valid @RequestBody YardRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(yardService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<YardResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody YardRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(yardService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        yardService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
