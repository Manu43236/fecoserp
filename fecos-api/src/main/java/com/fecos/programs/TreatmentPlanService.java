package com.fecos.programs;

import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.products.ProductRepository;
import com.fecos.tanks.TankService;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TreatmentPlanService {

    private final TreatmentPlanRepository planRepository;
    private final TreatmentPlanLineRepository lineRepository;
    private final WellRepository wellRepository;
    private final LeaseRepository leaseRepository;
    private final ClientRepository clientRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final TankService tankService;

    public Page<TreatmentPlanResponse> list(TreatmentPlanStatus status, UUID wellId, UUID accountRepId, int page, int size) {
        UUID tenantId = currentTenantId();
        return planRepository
                .search(tenantId, status, wellId, accountRepId, PageRequest.of(page, size))
                .map(p -> toResponse(p, false));
    }

    public TreatmentPlanResponse findById(UUID id) {
        return toResponse(findForTenant(id), true);
    }

    @Transactional
    public TreatmentPlanResponse create(TreatmentPlanRequest req) {
        UUID tenantId = currentTenantId();
        TreatmentPlanEntity p = new TreatmentPlanEntity();
        p.setTenantId(tenantId);
        p.setCreatedBy(currentUserId());
        apply(p, req, tenantId);
        return toResponse(planRepository.save(p), false);
    }

    @Transactional
    public TreatmentPlanResponse update(UUID id, TreatmentPlanRequest req) {
        UUID tenantId = currentTenantId();
        TreatmentPlanEntity p = findForTenant(id);
        apply(p, req, tenantId);
        return toResponse(planRepository.save(p), true);
    }

    @Transactional
    public void delete(UUID id) {
        TreatmentPlanEntity p = findForTenant(id);
        p.setDeleted(true);
        planRepository.save(p);
    }

    @Transactional
    public TreatmentPlanResponse addLine(UUID planId, TreatmentPlanLineRequest req) {
        UUID tenantId = currentTenantId();
        TreatmentPlanEntity p = findForTenant(planId);

        TreatmentPlanLineEntity line = new TreatmentPlanLineEntity();
        line.setTenantId(tenantId);
        line.setCreatedBy(currentUserId());
        line.setProgramId(p.getId());
        applyLine(line, req);
        lineRepository.save(line);

        if (req.getTankId() != null) {
            tankService.assignToPlan(req.getTankId());
        }

        return toResponse(p, true);
    }

    @Transactional
    public TreatmentPlanResponse updateLine(UUID planId, UUID lineId, TreatmentPlanLineRequest req) {
        TreatmentPlanEntity p = findForTenant(planId);
        TreatmentPlanLineEntity line = lineRepository.findByIdAndProgramIdAndIsDeletedFalse(lineId, planId)
                .orElseThrow(() -> new EntityNotFoundException("Line not found"));
        applyLine(line, req);
        lineRepository.save(line);
        return toResponse(p, true);
    }

    @Transactional
    public TreatmentPlanResponse removeLine(UUID planId, UUID lineId) {
        TreatmentPlanEntity p = findForTenant(planId);
        TreatmentPlanLineEntity line = lineRepository.findByIdAndProgramIdAndIsDeletedFalse(lineId, planId)
                .orElseThrow(() -> new EntityNotFoundException("Line not found"));
        if (line.getTankId() != null) {
            tankService.releaseFromPlan(line.getTankId());
        }
        line.setDeleted(true);
        lineRepository.save(line);
        return toResponse(p, true);
    }

    @Transactional
    public TreatmentPlanResponse transition(UUID planId, String action) {
        TreatmentPlanEntity p = findForTenant(planId);
        UUID tenantId = currentTenantId();

        switch (action) {
            case "start" -> {
                if (p.getStatus() != TreatmentPlanStatus.DRAFT)
                    throw new IllegalStateException("Only DRAFT plans can be started");
                planRepository.findAllByTenantIdAndWellIdAndStatusAndIsDeletedFalse(
                        tenantId, p.getWellId(), TreatmentPlanStatus.ACTIVE)
                    .forEach(existing -> {
                        if (!existing.getId().equals(p.getId())) {
                            existing.setStatus(TreatmentPlanStatus.SUSPENDED);
                            planRepository.save(existing);
                        }
                    });
                p.setStatus(TreatmentPlanStatus.ACTIVE);
                p.setStartedAt(Instant.now());
            }
            case "pause" -> {
                if (p.getStatus() != TreatmentPlanStatus.ACTIVE)
                    throw new IllegalStateException("Only ACTIVE plans can be paused");
                p.setStatus(TreatmentPlanStatus.PAUSED);
                p.setPausedAt(Instant.now());
            }
            case "resume" -> {
                if (p.getStatus() != TreatmentPlanStatus.PAUSED && p.getStatus() != TreatmentPlanStatus.SUSPENDED)
                    throw new IllegalStateException("Only PAUSED or SUSPENDED plans can be resumed");
                p.setStatus(TreatmentPlanStatus.ACTIVE);
                p.setResumedAt(Instant.now());
            }
            case "suspend" -> {
                if (p.getStatus() != TreatmentPlanStatus.ACTIVE && p.getStatus() != TreatmentPlanStatus.PAUSED)
                    throw new IllegalStateException("Plan cannot be suspended from its current status");
                p.setStatus(TreatmentPlanStatus.SUSPENDED);
            }
            case "complete" -> {
                if (p.getStatus() == TreatmentPlanStatus.COMPLETED)
                    throw new IllegalStateException("Plan is already completed");
                p.setStatus(TreatmentPlanStatus.COMPLETED);
            }
            default -> throw new IllegalArgumentException("Unknown action: " + action);
        }

        planRepository.save(p);
        return toResponse(p, true);
    }

    private void apply(TreatmentPlanEntity p, TreatmentPlanRequest req, UUID tenantId) {
        p.setWellId(req.getWellId());
        p.setAccountRepId(req.getAccountRepId());
        p.setNotes(req.getNotes());
        p.setStartDate(req.getStartDate());
        p.setEndDate(req.getEndDate());

        TreatmentPlanStatus newStatus = req.getStatus() != null ? req.getStatus() : TreatmentPlanStatus.DRAFT;

        if (newStatus == TreatmentPlanStatus.ACTIVE && p.getStatus() != TreatmentPlanStatus.ACTIVE) {
            planRepository.findAllByTenantIdAndWellIdAndStatusAndIsDeletedFalse(
                    tenantId, req.getWellId(), TreatmentPlanStatus.ACTIVE)
                .forEach(existing -> {
                    if (!existing.getId().equals(p.getId())) {
                        existing.setStatus(TreatmentPlanStatus.INACTIVE);
                        planRepository.save(existing);
                    }
                });
        }

        p.setStatus(newStatus);
    }

    private void applyLine(TreatmentPlanLineEntity line, TreatmentPlanLineRequest req) {
        line.setProductId(req.getProductId());
        line.setRecRate(req.getRecRate());
        line.setMethod(req.getMethod());
        line.setSchedule(req.getMethod() == TreatmentPlanMethod.BATCH ? req.getSchedule() : null);
        line.setNotes(req.getNotes());
        line.setTankOwner(req.getTankOwner());
        line.setTankLevelPct(req.getTankLevelPct());
        line.setTankLevelCheckedAt(req.getTankLevelCheckedAt());
        line.setTankId(req.getTankId());
    }

    private TreatmentPlanResponse toResponse(TreatmentPlanEntity p, boolean includeLines) {
        String wellName = null, leaseName = null, clientName = null;

        if (p.getWellId() != null) {
            var wellOpt = wellRepository.findByIdAndTenantIdAndIsDeletedFalse(p.getWellId(), p.getTenantId());
            if (wellOpt.isPresent()) {
                var well = wellOpt.get();
                wellName = well.getWellName();
                var leaseOpt = leaseRepository.findByIdAndTenantIdAndIsDeletedFalse(well.getLeaseId(), p.getTenantId());
                if (leaseOpt.isPresent()) {
                    var lease = leaseOpt.get();
                    leaseName = lease.getLeaseName();
                    clientName = clientRepository.findById(lease.getClientId())
                            .map(c -> c.getCompanyName()).orElse(null);
                }
            }
        }

        String accountRepName = null;
        if (p.getAccountRepId() != null) {
            accountRepName = userRepository.findById(p.getAccountRepId())
                    .map(u -> u.getFullName()).orElse(null);
        }

        long lineCount = lineRepository.countByProgramIdAndIsDeletedFalse(p.getId());
        List<TreatmentPlanLineResponse> lines = List.of();
        if (includeLines) {
            lines = lineRepository.findAllByProgramIdAndIsDeletedFalseOrderByCreatedAtAsc(p.getId())
                    .stream()
                    .map(l -> {
                        String productName = productRepository.findById(l.getProductId())
                                .map(pr -> pr.getName()).orElse(l.getProductId().toString());
                        return TreatmentPlanLineResponse.from(l, productName, null);
                    })
                    .toList();
        }

        return TreatmentPlanResponse.from(p, wellName, leaseName, clientName, accountRepName, lines, lineCount);
    }

    private TreatmentPlanEntity findForTenant(UUID id) {
        return planRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Treatment plan not found"));
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
