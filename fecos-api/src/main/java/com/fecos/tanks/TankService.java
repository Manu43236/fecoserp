package com.fecos.tanks;

import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.clients.ClientRepository;
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
public class TankService {

    private final TankRepository tankRepository;
    private final TankEventRepository eventRepository;
    private final WellRepository wellRepository;
    private final LeaseRepository leaseRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    public Page<TankResponse> list(int page, int size) {
        return tankRepository
                .findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(currentTenantId(), PageRequest.of(page, size))
                .map(t -> toResponse(t, false));
    }

    public TankResponse findById(UUID id) {
        return toResponse(findForTenant(id), true);
    }

    @Transactional
    public TankResponse create(TankRequest req) {
        UUID tenantId = currentTenantId();
        TankEntity t = new TankEntity();
        t.setTenantId(tenantId);
        t.setCreatedBy(currentUserId());
        t.setStatus(TankStatus.AVAILABLE);
        apply(t, req);
        return toResponse(tankRepository.save(t), false);
    }

    @Transactional
    public TankResponse update(UUID id, TankRequest req) {
        TankEntity t = findForTenant(id);
        apply(t, req);
        return toResponse(tankRepository.save(t), true);
    }

    @Transactional
    public void markAvailable(UUID id) {
        TankEntity t = findForTenant(id);
        t.setStatus(TankStatus.AVAILABLE);
        tankRepository.save(t);
    }

    // Called by TreatmentPlanService when a line is assigned/released
    @Transactional
    public void assignToPlan(UUID id) {
        TankEntity t = findForTenant(id);
        t.setStatus(TankStatus.ASSIGNED);
        tankRepository.save(t);
    }

    @Transactional
    public void releaseFromPlan(UUID id) {
        TankEntity t = findForTenant(id);
        if (t.getStatus() == TankStatus.ASSIGNED) {
            t.setStatus(TankStatus.AVAILABLE);
            tankRepository.save(t);
        }
    }

    @Transactional
    public void delete(UUID id) {
        TankEntity t = findForTenant(id);
        t.setDeleted(true);
        tankRepository.save(t);
    }

    @Transactional
    public TankResponse logEvent(UUID tankId, TankEventRequest req) {
        TankEntity tank = findForTenant(tankId);
        UUID tenantId = currentTenantId();

        TankEventEntity event = new TankEventEntity();
        event.setTenantId(tenantId);
        event.setTankId(tankId);
        event.setEventType(req.getEventType());
        event.setAmountGallons(req.getAmountGallons());
        event.setRecRate(req.getRecRate());
        event.setEventAt(req.getEventAt());
        event.setPerformedById(currentUserId());

        // For FILLED and REFILLED, calculate resulting level
        if (req.getEventType() == TankEventType.FILLED || req.getEventType() == TankEventType.REFILLED) {
            BigDecimal currentLevel = calculateCurrentLevel(tankId, tank.getCapacityGallons());
            BigDecimal currentGallons = currentLevel.multiply(tank.getCapacityGallons())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal newGallons = currentGallons.add(req.getAmountGallons() != null ? req.getAmountGallons() : BigDecimal.ZERO);
            BigDecimal newLevelPct = newGallons.multiply(BigDecimal.valueOf(100))
                    .divide(tank.getCapacityGallons(), 2, RoundingMode.HALF_UP)
                    .min(BigDecimal.valueOf(100));
            event.setLevelPct(newLevelPct);
        }

        if (req.getEventType() == TankEventType.INSTALLED) {
            tank.setStatus(TankStatus.INSTALLED);
            tank.setInstalledAt(req.getEventAt());
            tankRepository.save(tank);
        }

        if (req.getEventType() == TankEventType.REMOVED) {
            tank.setStatus(TankStatus.CLEANING);
            tank.setRemovedAt(req.getEventAt());
            tankRepository.save(tank);
        }

        eventRepository.save(event);
        return toResponse(tank, true);
    }

    public BigDecimal getCalculatedLevel(UUID tankId) {
        TankEntity tank = findForTenant(tankId);
        return calculateCurrentLevel(tankId, tank.getCapacityGallons());
    }

    // ── Level Calculation (dead reckoning) ────────────────────────────────────────

    BigDecimal calculateCurrentLevel(UUID tankId, BigDecimal capacityGallons) {
        // Find the most recent fill event — that's our baseline
        List<TankEventEntity> fillEvents = eventRepository
                .findAllByTankIdAndEventTypeInOrderByEventAtDesc(
                        tankId, List.of(TankEventType.FILLED, TankEventType.REFILLED));

        if (fillEvents.isEmpty()) return BigDecimal.ZERO;

        // If tank was removed after the last fill, it starts empty at next install
        List<TankEventEntity> removedEvents = eventRepository
                .findAllByTankIdAndEventTypeInOrderByEventAtDesc(
                        tankId, List.of(TankEventType.REMOVED));
        if (!removedEvents.isEmpty() && removedEvents.get(0).getEventAt().isAfter(fillEvents.get(0).getEventAt())) {
            return BigDecimal.ZERO;
        }

        TankEventEntity baseline = fillEvents.get(0);
        BigDecimal baselinePct = baseline.getLevelPct() != null ? baseline.getLevelPct() : BigDecimal.ZERO;
        Instant baselineTime = baseline.getEventAt();

        // Find the most recent rate change after the baseline fill
        List<TankEventEntity> rateEvents = eventRepository
                .findAllByTankIdAndEventTypeInOrderByEventAtDesc(
                        tankId, List.of(TankEventType.RATE_CHANGED));

        BigDecimal recRate = BigDecimal.ZERO;
        for (TankEventEntity rateEvent : rateEvents) {
            if (!rateEvent.getEventAt().isBefore(baselineTime) && rateEvent.getRecRate() != null) {
                recRate = rateEvent.getRecRate();
                break;
            }
        }

        if (recRate.compareTo(BigDecimal.ZERO) == 0) {
            // No rate set — return baseline level (tank not pumping)
            return baselinePct;
        }

        // Hours elapsed since baseline
        long hoursElapsed = ChronoUnit.HOURS.between(baselineTime, Instant.now());

        // Gallons consumed = recRate (gal/day) × hours / 24
        BigDecimal gallonsConsumed = recRate
                .multiply(BigDecimal.valueOf(hoursElapsed))
                .divide(BigDecimal.valueOf(24), 4, RoundingMode.HALF_UP);

        // Convert to percentage consumed
        BigDecimal pctConsumed = gallonsConsumed
                .multiply(BigDecimal.valueOf(100))
                .divide(capacityGallons, 2, RoundingMode.HALF_UP);

        BigDecimal currentPct = baselinePct.subtract(pctConsumed);
        return currentPct.max(BigDecimal.ZERO);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private void apply(TankEntity t, TankRequest req) {
        t.setSerialNumber(req.getSerialNumber());
        t.setCapacityGallons(req.getCapacityGallons());
        t.setWellId(req.getWellId());
        if (req.getStatus() != null) t.setStatus(req.getStatus());
        if (req.getInstalledAt() != null) t.setInstalledAt(req.getInstalledAt());
    }

    private TankResponse toResponse(TankEntity t, boolean includeEvents) {
        String wellName = null, leaseName = null, clientName = null;
        if (t.getWellId() != null) {
            var wellOpt = wellRepository.findById(t.getWellId());
            if (wellOpt.isPresent()) {
                var well = wellOpt.get();
                wellName = well.getWellName();
                var leaseOpt = leaseRepository.findById(well.getLeaseId());
                if (leaseOpt.isPresent()) {
                    leaseName = leaseOpt.get().getLeaseName();
                    clientName = clientRepository.findById(leaseOpt.get().getClientId())
                            .map(c -> c.getCompanyName()).orElse(null);
                }
            }
        }

        BigDecimal levelPct = t.getStatus() == TankStatus.INSTALLED
                ? calculateCurrentLevel(t.getId(), t.getCapacityGallons())
                : BigDecimal.ZERO;

        BigDecimal levelGallons = levelPct
                .multiply(t.getCapacityGallons())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        List<TankResponse.TankEventResponse> events = List.of();
        if (includeEvents) {
            events = eventRepository.findAllByTankIdOrderByEventAtDesc(t.getId())
                    .stream()
                    .map(e -> {
                        String performedByName = e.getPerformedById() != null
                                ? userRepository.findById(e.getPerformedById())
                                        .map(u -> u.getFullName()).orElse(null)
                                : null;
                        return new TankResponse.TankEventResponse(
                                e.getId(), e.getEventType(), e.getAmountGallons(),
                                e.getRecRate(), e.getLevelPct(), performedByName,
                                e.getEventAt(), e.getCreatedAt());
                    }).toList();
        }

        return new TankResponse(
                t.getId(), t.getSerialNumber(), t.getCapacityGallons(),
                t.getWellId(), wellName, leaseName, clientName,
                t.getStatus(), t.getInstalledAt(), t.getRemovedAt(),
                levelPct, levelGallons, events, t.getCreatedAt());
    }

    private TankEntity findForTenant(UUID id) {
        return tankRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Tank not found"));
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
