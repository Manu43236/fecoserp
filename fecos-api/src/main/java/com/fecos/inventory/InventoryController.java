package com.fecos.inventory;

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
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stock")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<List<StockResponse>>> stock(
            @RequestParam(required = false) UUID warehouseId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.stock(warehouseId)));
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP')")
    public ResponseEntity<ApiResponse<Page<InventoryTransactionResponse>>> transactions(
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) InventoryTransactionType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.listTransactions(warehouseId, type, page, size)));
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InventoryTransactionResponse>> record(
            @Valid @RequestBody InventoryTransactionRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.record(req)));
    }
}
