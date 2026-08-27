package com.fecos.inventory;

import com.fecos.products.ProductRepository;
import com.fecos.users.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryTransactionRepository txRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<StockResponse> stock(UUID warehouseId) {
        UUID tenantId = currentTenantId();
        List<Object[]> rows = txRepository.stockSummary(tenantId, warehouseId);

        Map<UUID, String> warehouseNames = warehouseRepository
                .findByTenantIdAndIsDeletedFalseAndIsActiveTrue(tenantId)
                .stream().collect(Collectors.toMap(w -> w.getId(), w -> w.getName()));

        return rows.stream().map(row -> {
            UUID wId  = (UUID) row[0];
            UUID pId  = (UUID) row[1];
            String unit = (String) row[2];
            BigDecimal qty = (BigDecimal) row[3];

            String warehouseName = warehouseNames.getOrDefault(wId, wId.toString());
            String productName   = productRepository.findById(pId)
                    .map(p -> p.getName()).orElse(pId.toString());

            return new StockResponse(wId, warehouseName, pId, productName, unit, qty);
        }).toList();
    }

    public Page<InventoryTransactionResponse> listTransactions(UUID warehouseId, InventoryTransactionType type, int page, int size) {
        UUID tenantId = currentTenantId();
        Page<InventoryTransactionEntity> txPage = txRepository.search(tenantId, warehouseId, type, PageRequest.of(page, size));

        Map<UUID, String> warehouseNames = warehouseRepository
                .findByTenantIdAndIsDeletedFalseAndIsActiveTrue(tenantId)
                .stream().collect(Collectors.toMap(w -> w.getId(), w -> w.getName()));

        return txPage.map(t -> {
            String wName = warehouseNames.getOrDefault(t.getWarehouseId(), t.getWarehouseId().toString());
            String pName = productRepository.findById(t.getProductId())
                    .map(p -> p.getName()).orElse(t.getProductId().toString());
            return InventoryTransactionResponse.from(t, wName, pName);
        });
    }

    @Transactional
    public InventoryTransactionResponse record(InventoryTransactionRequest req) {
        UUID tenantId = currentTenantId();

        // Validate warehouse and product belong to this tenant
        warehouseRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getWarehouseId(), tenantId)
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found"));
        String productName = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Product not found"))
                .getName();
        String warehouseName = warehouseRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getWarehouseId(), tenantId)
                .get().getName();

        UUID userId = currentUserId();
        String createdByName = userRepository.findById(userId)
                .map(u -> u.getFullName()).orElse("Unknown");

        InventoryTransactionEntity tx = new InventoryTransactionEntity();
        tx.setTenantId(tenantId);
        tx.setCreatedBy(userId);
        tx.setCreatedByName(createdByName);
        tx.setWarehouseId(req.getWarehouseId());
        tx.setProductId(req.getProductId());
        tx.setType(req.getType());
        tx.setUnit(req.getUnit());
        tx.setNotes(req.getNotes());
        tx.setSupplierName(req.getSupplierName());
        tx.setTransactionDate(req.getTransactionDate());

        // RECEIPT = +qty, ISSUE = -qty, ADJUSTMENT = as entered (already signed)
        BigDecimal qty = req.getType() == InventoryTransactionType.ISSUE
                ? req.getQuantity().negate()
                : req.getQuantity();
        tx.setQuantity(qty);

        return InventoryTransactionResponse.from(txRepository.save(tx), warehouseName, productName);
    }

    public record RouteIssueItem(UUID productId, BigDecimal quantity, String unit, int stopSeq, String wellName) {}

    @Transactional
    public void issueForRoute(UUID tenantId, UUID userId, String createdByName,
                              UUID warehouseId, UUID routeId, LocalDate routeDate,
                              List<RouteIssueItem> items) {
        for (RouteIssueItem item : items) {
            String productName = productRepository.findById(item.productId())
                    .map(p -> p.getName()).orElse("");

            InventoryTransactionEntity tx = new InventoryTransactionEntity();
            tx.setTenantId(tenantId);
            tx.setCreatedBy(userId);
            tx.setCreatedByName(createdByName);
            tx.setWarehouseId(warehouseId);
            tx.setProductId(item.productId());
            tx.setType(InventoryTransactionType.ISSUE);
            tx.setQuantity(item.quantity().negate());
            tx.setUnit(item.unit());
            tx.setNotes("Route dispatch – Stop #" + item.stopSeq() + ": " + item.wellName());
            tx.setTransactionDate(routeDate);
            tx.setReferenceType("ROUTE");
            tx.setReferenceId(routeId);
            txRepository.save(tx);
        }
    }

    @Transactional
    public void returnForRoute(UUID tenantId, UUID userId, String createdByName,
                               UUID warehouseId, UUID routeId, LocalDate routeDate,
                               List<com.fecos.routes.ReturnInventoryRequest.ReturnItem> items) {
        for (var item : items) {
            if (item.getQty() == null || item.getQty().compareTo(BigDecimal.ZERO) <= 0) continue;
            InventoryTransactionEntity tx = new InventoryTransactionEntity();
            tx.setTenantId(tenantId);
            tx.setCreatedBy(userId);
            tx.setCreatedByName(createdByName);
            tx.setWarehouseId(warehouseId);
            tx.setProductId(item.getProductId());
            tx.setType(InventoryTransactionType.RECEIPT);
            tx.setQuantity(item.getQty());
            tx.setUnit(item.getUnit());
            tx.setNotes("Route return – undelivered stock");
            tx.setTransactionDate(routeDate);
            tx.setReferenceType("ROUTE_RETURN");
            tx.setReferenceId(routeId);
            txRepository.save(tx);
        }
    }

    @Transactional
    public void reverseRouteIssues(UUID tenantId, UUID userId, String createdByName, UUID routeId) {
        List<InventoryTransactionEntity> issued = txRepository
                .findByTenantIdAndReferenceIdAndReferenceTypeAndIsDeletedFalse(tenantId, routeId, "ROUTE");
        for (InventoryTransactionEntity issue : issued) {
            InventoryTransactionEntity reversal = new InventoryTransactionEntity();
            reversal.setTenantId(tenantId);
            reversal.setCreatedBy(userId);
            reversal.setCreatedByName(createdByName);
            reversal.setWarehouseId(issue.getWarehouseId());
            reversal.setProductId(issue.getProductId());
            reversal.setType(InventoryTransactionType.RECEIPT);
            reversal.setQuantity(issue.getQuantity().negate()); // issue qty is negative → reversal is positive
            reversal.setUnit(issue.getUnit());
            reversal.setNotes("Route cancelled – reversal of dispatch");
            reversal.setTransactionDate(LocalDate.now());
            reversal.setReferenceType("ROUTE_REVERSAL");
            reversal.setReferenceId(routeId);
            txRepository.save(reversal);
        }
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"))
                .getTenantId();
    }

    private UUID currentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
