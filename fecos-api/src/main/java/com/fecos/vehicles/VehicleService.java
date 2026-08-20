package com.fecos.vehicles;

import com.fecos.users.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public Page<VehicleResponse> list(VehicleType type, VehicleStatus status, String search, int page, int size) {
        UUID tenantId = currentTenantId();
        var pageable = PageRequest.of(page, size);

        Page<VehicleEntity> entities;
        if (search != null && !search.isBlank()) {
            entities = vehicleRepository.search(tenantId, search.trim(), pageable);
        } else if (type != null && status != null) {
            entities = vehicleRepository.findAllByTenantIdAndVehicleTypeAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, type, status, pageable);
        } else if (type != null) {
            entities = vehicleRepository.findAllByTenantIdAndVehicleTypeAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, type, pageable);
        } else if (status != null) {
            entities = vehicleRepository.findAllByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, status, pageable);
        } else {
            entities = vehicleRepository.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, pageable);
        }
        return entities.map(this::toResponse);
    }

    public VehicleResponse findById(UUID id) {
        return toResponse(findForTenant(id));
    }

    @Transactional
    public VehicleResponse create(VehicleRequest req) {
        VehicleEntity v = new VehicleEntity();
        v.setTenantId(currentTenantId());
        v.setCreatedBy(currentUserId());
        apply(v, req);
        return toResponse(vehicleRepository.save(v));
    }

    @Transactional
    public VehicleResponse update(UUID id, VehicleRequest req) {
        VehicleEntity v = findForTenant(id);
        apply(v, req);
        return toResponse(vehicleRepository.save(v));
    }

    @Transactional
    public void delete(UUID id) {
        VehicleEntity v = findForTenant(id);
        v.setDeleted(true);
        vehicleRepository.save(v);
    }

    private void apply(VehicleEntity v, VehicleRequest req) {
        v.setVehicleType(req.getVehicleType());
        v.setMake(req.getMake());
        v.setModel(req.getModel());
        v.setYear(req.getYear());
        v.setLicensePlate(req.getLicensePlate());
        v.setVinNumber(req.getVinNumber());
        v.setDotNumber(req.getDotNumber());
        v.setCurrentMileage(req.getCurrentMileage());
        v.setNotes(req.getNotes());
        if (req.getStatus() != null) v.setStatus(req.getStatus());
    }

    private VehicleEntity findForTenant(UUID id) {
        return vehicleRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found"));
    }

    private VehicleResponse toResponse(VehicleEntity v) {
        return new VehicleResponse(
                v.getId(), v.getVehicleType(), v.getMake(), v.getModel(),
                v.getYear(), v.getLicensePlate(), v.getVinNumber(), v.getDotNumber(),
                v.getCurrentMileage(), v.getStatus(), v.getNotes(), v.getCreatedAt()
        );
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
