package com.fecos.inventory;

import com.fecos.common.RefNumberService;
import com.fecos.users.UserRepository;
import com.fecos.yards.YardRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final YardRepository yardRepository;
    private final UserRepository userRepository;
    private final RefNumberService refNumberService;

    public Page<WarehouseResponse> list(String search, int page, int size) {
        return warehouseRepository
                .search(currentTenantId(), search, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public List<WarehouseResponse> listActive() {
        return warehouseRepository
                .findByTenantIdAndIsDeletedFalseAndIsActiveTrue(currentTenantId())
                .stream().map(this::toResponse).toList();
    }

    public WarehouseResponse findById(UUID id) {
        return toResponse(findForTenant(id));
    }

    @Transactional
    public WarehouseResponse create(WarehouseRequest req) {
        UUID tenantId = currentTenantId();
        if (warehouseRepository.existsByNameAndTenantIdAndIsDeletedFalse(req.getName(), tenantId))
            throw new IllegalArgumentException("A warehouse with this name already exists");

        WarehouseEntity w = new WarehouseEntity();
        w.setTenantId(tenantId);
        w.setCreatedBy(currentUserId());
        int seq = warehouseRepository.maxRefSeq(tenantId) + 1;
        w.setRefSeq(seq);
        w.setRefNumber(refNumberService.next(tenantId, "WH", seq));
        apply(w, req);
        return toResponse(warehouseRepository.save(w));
    }

    @Transactional
    public WarehouseResponse update(UUID id, WarehouseRequest req) {
        WarehouseEntity w = findForTenant(id);
        apply(w, req);
        return toResponse(warehouseRepository.save(w));
    }

    @Transactional
    public void delete(UUID id) {
        WarehouseEntity w = findForTenant(id);
        w.setDeleted(true);
        warehouseRepository.save(w);
    }

    private void apply(WarehouseEntity w, WarehouseRequest req) {
        // Yard is required and must belong to this tenant
        yardRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getYardId(), currentTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Selected yard was not found"));
        w.setName(req.getName());
        w.setLocation(req.getLocation());
        w.setYardId(req.getYardId());
        w.setActive(req.isActive());
    }

    private WarehouseResponse toResponse(WarehouseEntity w) {
        String yardName = w.getYardId() == null ? null
                : yardRepository.findById(w.getYardId()).map(y -> y.getName()).orElse(null);
        return WarehouseResponse.from(w, yardName);
    }

    private WarehouseEntity findForTenant(UUID id) {
        return warehouseRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found"));
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
