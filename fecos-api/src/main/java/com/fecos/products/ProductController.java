package com.fecos.products;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(productService.list(search, category, isActive, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','LAB_TECH')")
    public ResponseEntity<ApiResponse<ProductResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(productService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(productService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
