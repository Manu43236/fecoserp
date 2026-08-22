package com.fecos.programs;

import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.products.ProductRepository;
import com.fecos.pumpshop.PumpRepository;
import com.fecos.pumpshop.PumpStatus;
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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
    private final PumpRepository pumpRepository;

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
            if (req.getRecRate() != null && p.getStatus() == TreatmentPlanStatus.ACTIVE) {
                tankService.logRateChange(req.getTankId(), req.getRecRate());
            }
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
        if (req.getTankId() != null && req.getRecRate() != null && p.getStatus() == TreatmentPlanStatus.ACTIVE) {
            tankService.logRateChange(req.getTankId(), req.getRecRate());
        }
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
                List<TreatmentPlanLineEntity> lines =
                        lineRepository.findAllByProgramIdAndIsDeletedFalseOrderByCreatedAtAsc(p.getId());
                if (lines.isEmpty())
                    throw new IllegalStateException("Add at least one product before starting");
                for (TreatmentPlanLineEntity line : lines) {
                    String name = productRepository.findById(line.getProductId())
                            .map(pr -> pr.getName()).orElse("Unknown product");
                    if (line.getTankId() == null)
                        throw new IllegalStateException("Tank not assigned for: " + name);
                    if (pumpRepository.findDeployedPumpForTank(line.getTankId(), PumpStatus.DEPLOYED).isEmpty())
                        throw new IllegalStateException("No pump deployed for: " + name);
                }
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
                logRateEventsForLines(p.getId());
            }
            case "pause" -> {
                if (p.getStatus() != TreatmentPlanStatus.ACTIVE)
                    throw new IllegalStateException("Only ACTIVE plans can be paused");
                lineRepository.findAllByProgramIdAndIsDeletedFalseOrderByCreatedAtAsc(p.getId())
                        .forEach(line -> {
                            if (line.getTankId() != null) tankService.logLevelSnapshot(line.getTankId());
                        });
                p.setStatus(TreatmentPlanStatus.PAUSED);
                p.setPausedAt(Instant.now());
            }
            case "resume" -> {
                if (p.getStatus() != TreatmentPlanStatus.PAUSED && p.getStatus() != TreatmentPlanStatus.SUSPENDED)
                    throw new IllegalStateException("Only PAUSED or SUSPENDED plans can be resumed");
                p.setStatus(TreatmentPlanStatus.ACTIVE);
                p.setResumedAt(Instant.now());
                if (p.getStartedAt() == null) p.setStartedAt(Instant.now());
                lineRepository.findAllByProgramIdAndIsDeletedFalseOrderByCreatedAtAsc(p.getId())
                        .forEach(line -> {
                            if (line.getTankId() != null) tankService.logResumeEvent(line.getTankId());
                        });
                logRateEventsForLines(p.getId());
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

    private void logRateEventsForLines(UUID planId) {
        lineRepository.findAllByProgramIdAndIsDeletedFalseOrderByCreatedAtAsc(planId).forEach(line -> {
            if (line.getTankId() != null && line.getRecRate() != null) {
                tankService.logRateChange(line.getTankId(), line.getRecRate());
            }
        });
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
        line.setThirdPartyName(req.getThirdPartyName());
        line.setThirdPartyCapacityGallons(req.getThirdPartyCapacityGallons());
        line.setThirdPartySerial(req.getThirdPartySerial());
    }

    private BigDecimal calcThirdPartyLevel(TreatmentPlanLineEntity l) {
        if (l.getTankOwner() != com.fecos.tanks.TankOwner.THIRD_PARTY
                || l.getTankLevelPct() == null
                || l.getTankLevelCheckedAt() == null
                || l.getThirdPartyCapacityGallons() == null
                || l.getRecRate() == null
                || l.getThirdPartyCapacityGallons().compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        long minutesElapsed = ChronoUnit.MINUTES.between(l.getTankLevelCheckedAt(), Instant.now());
        BigDecimal gallonsConsumed = l.getRecRate()
                .multiply(BigDecimal.valueOf(minutesElapsed))
                .divide(BigDecimal.valueOf(24 * 60), 4, RoundingMode.HALF_UP);
        BigDecimal baselineGallons = l.getTankLevelPct()
                .multiply(l.getThirdPartyCapacityGallons())
                .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
        BigDecimal currentGallons = baselineGallons.subtract(gallonsConsumed);
        return currentGallons
                .multiply(BigDecimal.valueOf(100))
                .divide(l.getThirdPartyCapacityGallons(), 2, RoundingMode.HALF_UP)
                .max(BigDecimal.ZERO)
                .min(BigDecimal.valueOf(100));
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
                        boolean pumpDeployed = false;
                        UUID pumpId = null;
                        String pumpSerial = null;
                        if (l.getTankId() != null) {
                            var pump = pumpRepository.findDeployedPumpForTank(l.getTankId(), PumpStatus.DEPLOYED);
                            if (pump.isPresent()) {
                                pumpDeployed = true;
                                pumpId = pump.get().getId();
                                pumpSerial = pump.get().getSerialNumber();
                            }
                        }
                        String updatedByName = l.getRecRateUpdatedBy() != null
                                ? userRepository.findById(l.getRecRateUpdatedBy()).map(u -> u.getFullName()).orElse(null)
                                : null;
                        return TreatmentPlanLineResponse.from(l, productName, calcThirdPartyLevel(l), pumpDeployed, pumpId, pumpSerial, updatedByName);
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
