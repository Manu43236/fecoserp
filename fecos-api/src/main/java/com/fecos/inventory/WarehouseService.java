package com.fecos.inventory;

import com.fecos.users.UserRepository;
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
    private final UserRepository userRepository;

    public Page<WarehouseResponse> list(String search, int page, int size) {
        return warehouseRepository
                .search(currentTenantId(), search, PageRequest.of(page, size))
                .map(WarehouseResponse::from);
    }

    public List<WarehouseResponse> listActive() {
        return warehouseRepository
                .findByTenantIdAndIsDeletedFalseAndIsActiveTrue(currentTenantId())
                .stream().map(WarehouseResponse::from).toList();
    }

    public WarehouseResponse findById(UUID id) {
        return WarehouseResponse.from(findForTenant(id));
    }

    @Transactional
    public WarehouseResponse create(WarehouseRequest req) {
        UUID tenantId = currentTenantId();
        if (warehouseRepository.existsByNameAndTenantIdAndIsDeletedFalse(req.getName(), tenantId))
            throw new IllegalArgumentException("A warehouse with this name already exists");

        WarehouseEntity w = new WarehouseEntity();
        w.setTenantId(tenantId);
        w.setCreatedBy(currentUserId());
        apply(w, req);
        return WarehouseResponse.from(warehouseRepository.save(w));
    }

    @Transactional
    public WarehouseResponse update(UUID id, WarehouseRequest req) {
        WarehouseEntity w = findForTenant(id);
        apply(w, req);
        return WarehouseResponse.from(warehouseRepository.save(w));
    }

    @Transactional
    public void delete(UUID id) {
        WarehouseEntity w = findForTenant(id);
        w.setDeleted(true);
        warehouseRepository.save(w);
    }

    private void apply(WarehouseEntity w, WarehouseRequest req) {
        w.setName(req.getName());
        w.setLocation(req.getLocation());
        w.setActive(req.isActive());
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
