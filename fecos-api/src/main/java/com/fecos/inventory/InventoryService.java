package com.fecos.inventory;

import com.fecos.common.RefNumberService;
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
import java.util.HashMap;
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
    private final RefNumberService refNumberService;

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

        int seq = txRepository.maxRefSeq(tenantId) + 1;
        InventoryTransactionEntity tx = new InventoryTransactionEntity();
        tx.setTenantId(tenantId);
        tx.setRefSeq(seq);
        tx.setRefNumber(refNumberService.next(tenantId, "TX", seq));
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

    /** True if this route already had stock issued (so we don't double-issue on the self-claim start path). */
    public boolean hasIssuesForRoute(UUID tenantId, UUID routeId) {
        return !txRepository
                .findByTenantIdAndReferenceIdAndReferenceTypeAndIsDeletedFalse(tenantId, routeId, "ROUTE")
                .isEmpty();
    }

    /** Current stock per product at a warehouse. */
    private Map<UUID, BigDecimal> stockByProduct(UUID tenantId, UUID warehouseId) {
        Map<UUID, BigDecimal> stock = new HashMap<>();
        for (Object[] row : txRepository.stockSummary(tenantId, warehouseId)) {
            stock.merge((UUID) row[1], (BigDecimal) row[3], BigDecimal::add);
        }
        return stock;
    }

    /** Of the given products, the names that are fully out of stock (≤ 0) at the warehouse. */
    public List<String> outOfStockNames(UUID tenantId, UUID warehouseId, java.util.Collection<UUID> productIds) {
        Map<UUID, BigDecimal> stock = stockByProduct(tenantId, warehouseId);
        List<String> names = new ArrayList<>();
        for (UUID pid : productIds) {
            if (stock.getOrDefault(pid, BigDecimal.ZERO).compareTo(BigDecimal.ZERO) <= 0) {
                names.add(productRepository.findById(pid).map(p -> p.getName()).orElse("product"));
            }
        }
        return names;
    }

    @Transactional
    public void issueForRoute(UUID tenantId, UUID userId, String createdByName,
                              UUID warehouseId, UUID routeId, LocalDate routeDate,
                              List<RouteIssueItem> items) {
        // Cap each product's issue at what's actually in stock — never go negative, never block.
        // Short loads are expected: the driver takes what's available and the shortfall is flagged upstream.
        Map<UUID, BigDecimal> remaining = stockByProduct(tenantId, warehouseId);
        int[] issueSeq = { txRepository.maxRefSeq(tenantId) };
        for (RouteIssueItem item : items) {
            BigDecimal avail = remaining.getOrDefault(item.productId(), BigDecimal.ZERO);
            BigDecimal issueQty = item.quantity().min(avail);
            if (issueQty.compareTo(BigDecimal.ZERO) <= 0) continue; // nothing left for this product
            remaining.put(item.productId(), avail.subtract(issueQty));

            issueSeq[0]++;
            InventoryTransactionEntity tx = new InventoryTransactionEntity();
            tx.setTenantId(tenantId);
            tx.setRefSeq(issueSeq[0]);
            tx.setRefNumber(refNumberService.next(tenantId, "TX", issueSeq[0]));
            tx.setCreatedBy(userId);
            tx.setCreatedByName(createdByName);
            tx.setWarehouseId(warehouseId);
            tx.setProductId(item.productId());
            tx.setType(InventoryTransactionType.ISSUE);
            tx.setQuantity(issueQty.negate());
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
        int[] returnSeq = { txRepository.maxRefSeq(tenantId) };
        for (var item : items) {
            if (item.getQty() == null || item.getQty().compareTo(BigDecimal.ZERO) <= 0) continue;
            returnSeq[0]++;
            InventoryTransactionEntity tx = new InventoryTransactionEntity();
            tx.setTenantId(tenantId);
            tx.setRefSeq(returnSeq[0]);
            tx.setRefNumber(refNumberService.next(tenantId, "TX", returnSeq[0]));
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
        int[] reversalSeq = { txRepository.maxRefSeq(tenantId) };
        for (InventoryTransactionEntity issue : issued) {
            reversalSeq[0]++;
            InventoryTransactionEntity reversal = new InventoryTransactionEntity();
            reversal.setTenantId(tenantId);
            reversal.setRefSeq(reversalSeq[0]);
            reversal.setRefNumber(refNumberService.next(tenantId, "TX", reversalSeq[0]));
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
