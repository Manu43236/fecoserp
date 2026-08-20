package com.fecos.rawqc;

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
public class RawMaterialService {

    private final RawMaterialBatchRepository repository;
    private final UserRepository userRepository;

    public Page<RawMaterialBatchResponse> list(RawMaterialStatus status, int page, int size) {
        UUID tenantId = currentTenantId();
        var pageable = PageRequest.of(page, size);
        var entities = status != null
                ? repository.findAllByTenantIdAndStatusAndIsDeletedFalseOrderByReceivedDateDesc(tenantId, status, pageable)
                : repository.findAllByTenantIdAndIsDeletedFalseOrderByReceivedDateDesc(tenantId, pageable);
        return entities.map(e -> toResponse(e));
    }

    public RawMaterialBatchResponse findById(UUID id) {
        return toResponse(findForTenant(id));
    }

    @Transactional
    public RawMaterialBatchResponse create(RawMaterialBatchRequest req) {
        UUID tenantId = currentTenantId();
        var entity = new RawMaterialBatchEntity();
        entity.setTenantId(tenantId);
        entity.setCreatedBy(currentUserId());
        entity.setBatchNumber(generateBatchNumber(tenantId, req.getReceivedDate()));
        entity.setSupplierName(req.getSupplierName());
        entity.setMaterialName(req.getMaterialName());
        entity.setQuantity(req.getQuantity());
        entity.setUnit(req.getUnit());
        entity.setReceivedDate(req.getReceivedDate());
        entity.setSupplierLotNumber(req.getSupplierLotNumber());
        return toResponse(repository.save(entity));
    }

    @Transactional
    public RawMaterialBatchResponse startTesting(UUID id) {
        var entity = findForTenant(id);
        if (entity.getStatus() != RawMaterialStatus.PENDING)
            throw new IllegalStateException("Batch is not in PENDING status");
        entity.setStatus(RawMaterialStatus.IN_PROGRESS);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public RawMaterialBatchResponse enterResults(UUID id, RawMaterialResultRequest req) {
        var entity = findForTenant(id);
        if (entity.getStatus() != RawMaterialStatus.IN_PROGRESS)
            throw new IllegalStateException("Batch must be IN_PROGRESS to enter results");
        if (req.getResult() != RawMaterialStatus.PASSED && req.getResult() != RawMaterialStatus.FAILED)
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
    public void delete(UUID id) {
        var entity = findForTenant(id);
        if (entity.getStatus() == RawMaterialStatus.PASSED)
            throw new IllegalArgumentException("Cannot delete a passed batch");
        entity.setDeleted(true);
        repository.save(entity);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String generateBatchNumber(UUID tenantId, LocalDate date) {
        String prefix = "RM-" + date.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        long count = repository.countByTenantIdAndBatchNumberStartingWith(tenantId, prefix);
        return prefix + String.format("%04d", count + 1);
    }

    private RawMaterialBatchEntity findForTenant(UUID id) {
        return repository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Batch not found"));
    }

    private RawMaterialBatchResponse toResponse(RawMaterialBatchEntity e) {
        String testedByName = e.getTestedById() != null
                ? userRepository.findById(e.getTestedById()).map(u -> u.getFullName()).orElse(null)
                : null;
        return new RawMaterialBatchResponse(
                e.getId(), e.getBatchNumber(), e.getSupplierName(), e.getMaterialName(),
                e.getQuantity(), e.getUnit(), e.getReceivedDate(), e.getSupplierLotNumber(),
                e.getStatus(), e.getAppearance(), e.getColorOk(), e.getOdor(),
                e.getPh(), e.getSpecificGravity(), e.getNotes(),
                testedByName, e.getTestedAt(), e.getCreatedAt());
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
