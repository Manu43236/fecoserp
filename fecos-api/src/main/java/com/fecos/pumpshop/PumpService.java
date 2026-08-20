package com.fecos.pumpshop;

import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.programs.TreatmentPlanLineRepository;
import com.fecos.programs.TreatmentPlanStatus;
import com.fecos.tanks.TankEntity;
import com.fecos.tanks.TankRepository;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
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
public class PumpService {

    private final PumpRepository pumpRepository;
    private final PumpMaintenanceLogRepository logRepository;
    private final TankRepository tankRepository;
    private final TreatmentPlanLineRepository planLineRepository;
    private final WellRepository wellRepository;
    private final LeaseRepository leaseRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public Page<PumpResponse> list(PumpStatus status, int page, int size) {
        UUID tenantId = currentTenantId();
        var pageable = PageRequest.of(page, size);
        Page<PumpEntity> entities = status != null
                ? pumpRepository.findAllByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, status, pageable)
                : pumpRepository.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, pageable);
        return entities.map(p -> toResponse(p, false));
    }

    public PumpResponse findById(UUID id) {
        return toResponse(findForTenant(id), true);
    }

    @Transactional
    public PumpResponse create(PumpRequest req) {
        PumpEntity p = new PumpEntity();
        p.setTenantId(currentTenantId());
        p.setCreatedBy(currentUserId());
        apply(p, req);
        return toResponse(pumpRepository.save(p), false);
    }

    @Transactional
    public PumpResponse update(UUID id, PumpRequest req) {
        PumpEntity p = findForTenant(id);
        apply(p, req);
        return toResponse(pumpRepository.save(p), true);
    }

    @Transactional
    public PumpResponse deploy(UUID id, DeployRequest req) {
        PumpEntity p = findForTenant(id);
        if (p.getStatus() == PumpStatus.DEPLOYED) {
            throw new IllegalArgumentException("Pump is already deployed — pull it first");
        }
        if (p.getStatus() == PumpStatus.UNDER_REPAIR) {
            throw new IllegalArgumentException("Pump is under repair — complete service before deploying");
        }
        // Verify tank belongs to tenant
        tankRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getTankId(), currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Tank not found"));
        p.setTankId(req.getTankId());
        p.setStatus(PumpStatus.DEPLOYED);
        return toResponse(pumpRepository.save(p), true);
    }

    @Transactional
    public PumpResponse pull(UUID id) {
        PumpEntity p = findForTenant(id);
        if (p.getStatus() != PumpStatus.DEPLOYED) {
            throw new IllegalArgumentException("Pump is not currently deployed");
        }
        if (p.getTankId() != null && planLineRepository.existsActivePlanForTank(p.getTankId(), TreatmentPlanStatus.ACTIVE)) {
            throw new IllegalStateException("Pump is on an active treatment — pause or complete the treatment before pulling");
        }
        p.setTankId(null);
        p.setStatus(PumpStatus.IN_SHOP);
        return toResponse(pumpRepository.save(p), true);
    }

    @Transactional
    public PumpResponse sendToRepair(UUID id) {
        PumpEntity p = findForTenant(id);
        if (p.getStatus() == PumpStatus.DEPLOYED && p.getTankId() != null
                && planLineRepository.existsActivePlanForTank(p.getTankId(), TreatmentPlanStatus.ACTIVE)) {
            throw new IllegalStateException("Pump is on an active treatment — pause or complete the treatment before sending to repair");
        }
        if (p.getStatus() == PumpStatus.DEPLOYED) {
            p.setTankId(null);
        }
        p.setStatus(PumpStatus.UNDER_REPAIR);
        return toResponse(pumpRepository.save(p), true);
    }

    @Transactional
    public PumpResponse logMaintenance(UUID id, PumpMaintenanceRequest req) {
        PumpEntity p = findForTenant(id);
        PumpMaintenanceLogEntity log = new PumpMaintenanceLogEntity();
        log.setTenantId(currentTenantId());
        log.setCreatedBy(currentUserId());
        log.setPumpId(id);
        log.setMaintenanceType(req.getMaintenanceType());
        log.setPerformedAt(req.getPerformedAt());
        log.setPerformedById(currentUserId());
        log.setNotes(req.getNotes());
        logRepository.save(log);

        // If under repair and a REPAIR log is added, mark back to IN_SHOP
        if (p.getStatus() == PumpStatus.UNDER_REPAIR && req.getMaintenanceType() == MaintenanceType.REPAIR) {
            p.setStatus(PumpStatus.IN_SHOP);
            pumpRepository.save(p);
        }
        return toResponse(p, true);
    }

    @Transactional
    public void delete(UUID id) {
        PumpEntity p = findForTenant(id);
        if (p.getStatus() == PumpStatus.DEPLOYED) {
            throw new IllegalArgumentException("Cannot delete a deployed pump — pull it first");
        }
        p.setDeleted(true);
        pumpRepository.save(p);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private void apply(PumpEntity p, PumpRequest req) {
        p.setSerialNumber(req.getSerialNumber());
        p.setMake(req.getMake());
        p.setModel(req.getModel());
        p.setPumpType(req.getPumpType());
        if (req.getOwner() != null) p.setOwner(req.getOwner());
        p.setNotes(req.getNotes());
    }

    private PumpResponse toResponse(PumpEntity p, boolean includeLogs) {
        String tankSerial = null, wellName = null, leaseName = null, clientName = null;
        UUID wellId = null;

        if (p.getTankId() != null) {
            var tankOpt = tankRepository.findById(p.getTankId());
            if (tankOpt.isPresent()) {
                TankEntity tank = tankOpt.get();
                tankSerial = tank.getSerialNumber();
                wellId = tank.getWellId();
            }
            // Fallback: if tank has no wellId, look it up via the treatment plan
            if (wellId == null) {
                var wellIds = planLineRepository.findWellIdsByTankId(p.getTankId());
                if (!wellIds.isEmpty()) wellId = wellIds.get(0);
            }
            if (wellId != null) {
                var wellOpt = wellRepository.findById(wellId);
                if (wellOpt.isPresent()) {
                    wellName = wellOpt.get().getWellName();
                    var leaseOpt = leaseRepository.findById(wellOpt.get().getLeaseId());
                    if (leaseOpt.isPresent()) {
                        leaseName = leaseOpt.get().getLeaseName();
                        clientName = clientRepository.findById(leaseOpt.get().getClientId())
                                .map(c -> c.getCompanyName()).orElse(null);
                    }
                }
            }
        }

        List<PumpResponse.MaintenanceLogResponse> logs = List.of();
        if (includeLogs) {
            logs = logRepository.findAllByPumpIdOrderByPerformedAtDesc(p.getId())
                    .stream()
                    .map(l -> {
                        String performedByName = l.getPerformedById() != null
                                ? userRepository.findById(l.getPerformedById())
                                        .map(u -> u.getFullName()).orElse(null)
                                : null;
                        return new PumpResponse.MaintenanceLogResponse(
                                l.getId(), l.getMaintenanceType(), l.getPerformedAt(),
                                performedByName, l.getNotes(), l.getCreatedAt());
                    }).toList();
        }

        boolean onActiveTreatment = p.getStatus() == PumpStatus.DEPLOYED && p.getTankId() != null
                && planLineRepository.existsActivePlanForTank(p.getTankId(), TreatmentPlanStatus.ACTIVE);

        return new PumpResponse(
                p.getId(), p.getSerialNumber(), p.getMake(), p.getModel(),
                p.getPumpType(), p.getOwner(), p.getStatus(),
                p.getTankId(), tankSerial, wellId, wellName, leaseName, clientName,
                p.getNotes(), onActiveTreatment, logs, p.getCreatedAt());
    }

    private PumpEntity findForTenant(UUID id) {
        return pumpRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Pump not found"));
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
