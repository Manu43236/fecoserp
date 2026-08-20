package com.fecos.finishedqc;

import com.fecos.inventory.InventoryService;
import com.fecos.inventory.InventoryTransactionRequest;
import com.fecos.inventory.InventoryTransactionType;
import com.fecos.products.ProductRepository;
import com.fecos.users.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinishedProductService {

    private final FinishedProductBatchRepository repository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final com.fecos.inventory.WarehouseRepository warehouseRepository;
    private final InventoryService inventoryService;

    public Page<FinishedProductBatchResponse> list(FinishedProductStatus status, int page, int size) {
        UUID tenantId = currentTenantId();
        var pageable = PageRequest.of(page, size);
        var entities = status != null
                ? repository.findAllByTenantIdAndStatusAndIsDeletedFalseOrderByBlendDateDesc(tenantId, status, pageable)
                : repository.findAllByTenantIdAndIsDeletedFalseOrderByBlendDateDesc(tenantId, pageable);
        return entities.map(this::toResponse);
    }

    public FinishedProductBatchResponse findById(UUID id) {
        return toResponse(findForTenant(id));
    }

    @Transactional
    public FinishedProductBatchResponse create(FinishedProductBatchRequest req) {
        UUID tenantId = currentTenantId();
        productRepository.findById(req.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        var entity = new FinishedProductBatchEntity();
        entity.setTenantId(tenantId);
        entity.setCreatedBy(currentUserId());
        entity.setBatchNumber(generateBatchNumber(tenantId, req.getBlendDate()));
        entity.setProductId(req.getProductId());
        entity.setQuantity(req.getQuantity());
        entity.setUnit(req.getUnit());
        entity.setBlendDate(req.getBlendDate());
        return toResponse(repository.save(entity));
    }

    @Transactional
    public FinishedProductBatchResponse startTesting(UUID id) {
        var entity = findForTenant(id);
        if (entity.getStatus() != FinishedProductStatus.PENDING)
            throw new IllegalStateException("Batch is not in PENDING status");
        entity.setStatus(FinishedProductStatus.IN_PROGRESS);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public FinishedProductBatchResponse enterResults(UUID id, FinishedProductResultRequest req) {
        var entity = findForTenant(id);
        if (entity.getStatus() != FinishedProductStatus.IN_PROGRESS)
            throw new IllegalStateException("Batch must be IN_PROGRESS to enter results");
        if (req.getResult() != FinishedProductStatus.PASSED && req.getResult() != FinishedProductStatus.FAILED)
            throw new IllegalArgumentException("Result must be PASSED or FAILED");

        entity.setAppearance(req.getAppearance());
        entity.setColorOk(req.getColorOk());
        entity.setOdor(req.getOdor());
        entity.setPh(req.getPh());
        entity.setSpecificGravity(req.getSpecificGravity());
        entity.setNotes(req.getNotes());
        entity.setStatus(req.getResult());
        entity.setTestedById(currentUserId());
        entity.setTestedAt(LocalDateTime.now());
        return toResponse(repository.save(entity));
    }

    @Transactional
    public FinishedProductBatchResponse moveToWarehouse(UUID id, MoveToWarehouseRequest req) {
        var entity = findForTenant(id);
        if (entity.getStatus() != FinishedProductStatus.PASSED)
            throw new IllegalStateException("Only PASSED batches can be moved to warehouse");
        if (entity.isMovedToWarehouse())
            throw new IllegalStateException("Batch already moved to warehouse");

        // Create inventory receipt
        var txReq = new InventoryTransactionRequest();
        txReq.setWarehouseId(req.getWarehouseId());
        txReq.setProductId(entity.getProductId());
        txReq.setType(InventoryTransactionType.RECEIPT);
        txReq.setQuantity(entity.getQuantity());
        txReq.setUnit(entity.getUnit());
        txReq.setNotes("QC batch " + entity.getBatchNumber() + " — finished product receipt");
        txReq.setTransactionDate(LocalDate.now());
        inventoryService.record(txReq);

        entity.setWarehouseId(req.getWarehouseId());
        entity.setMovedToWarehouse(true);
        entity.setMovedAt(LocalDateTime.now());
        return toResponse(repository.save(entity));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String generateBatchNumber(UUID tenantId, LocalDate date) {
        String prefix = "FP-" + date.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        long count = repository.countByTenantIdAndBatchNumberStartingWith(tenantId, prefix);
        return prefix + String.format("%04d", count + 1);
    }

    private FinishedProductBatchEntity findForTenant(UUID id) {
        return repository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Batch not found"));
    }

    private FinishedProductBatchResponse toResponse(FinishedProductBatchEntity e) {
        String productName = productRepository.findById(e.getProductId())
                .map(p -> p.getName()).orElse(null);
        String testedByName = e.getTestedById() != null
                ? userRepository.findById(e.getTestedById()).map(u -> u.getFullName()).orElse(null)
                : null;
        String warehouseName = e.getWarehouseId() != null
                ? warehouseRepository.findById(e.getWarehouseId()).map(w -> w.getName()).orElse(null)
                : null;
        return new FinishedProductBatchResponse(
                e.getId(), e.getBatchNumber(), e.getProductId(), productName,
                e.getQuantity(), e.getUnit(), e.getBlendDate(), e.getStatus(),
                e.getAppearance(), e.getColorOk(), e.getOdor(), e.getPh(), e.getSpecificGravity(),
                e.getNotes(), testedByName, e.getTestedAt(),
                e.getWarehouseId(), warehouseName, e.isMovedToWarehouse(), e.getMovedAt(),
                e.getCreatedAt());
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new EntityNotFoundException("User not found"))
                .getTenantId();
    }

    private UUID currentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
