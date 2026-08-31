package com.fecos.servicevisits;

import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.programs.TreatmentPlanEntity;
import com.fecos.programs.TreatmentPlanRepository;
import com.fecos.programs.TreatmentPlanSchedule;
import com.fecos.programs.TreatmentPlanStatus;
import com.fecos.servicereports.ServiceReportRepository;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellEntity;
import com.fecos.wells.WellRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ServiceVisitService {

    private final ServiceVisitRepository visitRepo;
    private final ServiceVisitStopRepository stopRepo;
    private final UserRepository userRepo;
    private final WellRepository wellRepo;
    private final LeaseRepository leaseRepo;
    private final ClientRepository clientRepo;
    private final TreatmentPlanRepository planRepo;
    private final ServiceReportRepository reportRepo;

    // ── List ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ServiceVisitResponse> list(int page, int size, ServiceVisitStatus status,
                                           UUID techId, LocalDate dateFrom, LocalDate dateTo) {
        UUID tenantId = currentTenantId();
        return visitRepo.search(tenantId, status, techId, dateFrom, dateTo, null, PageRequest.of(page, size))
                .map(v -> toResponse(v, true));
    }

    // ── Get ──────────────────────────────────────────────────────────────────

    public ServiceVisitResponse get(UUID id) {
        UUID tenantId = currentTenantId();
        ServiceVisitEntity v = visitRepo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Service visit not found"));
        return toResponse(v, true);
    }

    // ── Create ───────────────────────────────────────────────────────────────

    public ServiceVisitResponse create(ServiceVisitRequest req) {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();

        ServiceVisitEntity v = new ServiceVisitEntity();
        v.setTenantId(tenantId);
        v.setName(req.name());
        v.setVisitDate(req.visitDate());
        v.setTechId(req.techId());
        v.setNotes(req.notes());
        v.setStatus(ServiceVisitStatus.SCHEDULED);
        v.setCreatedBy(userId);
        v = visitRepo.save(v);

        if (req.wellIds() != null) {
            int seq = 1;
            for (UUID wellId : req.wellIds()) {
                ServiceVisitStopEntity stop = new ServiceVisitStopEntity();
                stop.setId(UUID.randomUUID());
                stop.setTenantId(tenantId);
                stop.setServiceVisitId(v.getId());
                stop.setWellId(wellId);
                stop.setSequence(seq++);
                stop.setStatus(ServiceVisitStopStatus.PENDING);
                stop.setCreatedBy(userId);
                stopRepo.save(stop);
            }
        }

        return toResponse(v, true);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    public ServiceVisitResponse update(UUID id, ServiceVisitUpdateRequest req) {
        UUID tenantId = currentTenantId();
        ServiceVisitEntity v = visitRepo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Service visit not found"));

        if (req.status()  != null) v.setStatus(req.status());
        if (req.notes()   != null) v.setNotes(req.notes());
        if (req.techId()  != null) v.setTechId(req.techId());
        if (req.visitDate() != null) v.setVisitDate(req.visitDate());

        return toResponse(visitRepo.save(v), true);
    }

    // ── Update status (mobile — SERVICE_TECH updates their own visit) ────────

    public void updateStatus(UUID id, ServiceVisitStatus status) {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();
        ServiceVisitEntity v = visitRepo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Service visit not found"));
        if (!v.getTechId().equals(userId)) {
            throw new RuntimeException("Not authorized to update this visit");
        }
        if (status != null) v.setStatus(status);
        visitRepo.save(v);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public void delete(UUID id) {
        UUID tenantId = currentTenantId();
        ServiceVisitEntity v = visitRepo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Service visit not found"));
        v.setDeleted(true);
        visitRepo.save(v);
    }

    // ── Stops ─────────────────────────────────────────────────────────────────

    public ServiceVisitResponse addStop(UUID visitId, ServiceVisitStopRequest req) {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();

        visitRepo.findByIdAndTenantIdAndIsDeletedFalse(visitId, tenantId)
                .orElseThrow(() -> new RuntimeException("Service visit not found"));

        List<ServiceVisitStopEntity> existing =
                stopRepo.findAllByServiceVisitIdAndIsDeletedFalseOrderBySequenceAsc(visitId);

        ServiceVisitStopEntity stop = new ServiceVisitStopEntity();
        stop.setId(UUID.randomUUID());
        stop.setTenantId(tenantId);
        stop.setServiceVisitId(visitId);
        stop.setWellId(req.wellId());
        stop.setSequence(existing.size() + 1);
        stop.setNotes(req.notes());
        stop.setCreatedBy(userId);
        stopRepo.save(stop);

        return get(visitId);
    }

    public ServiceVisitResponse updateStop(UUID visitId, UUID stopId, ServiceVisitStopUpdateRequest req) {
        UUID tenantId = currentTenantId();
        ServiceVisitStopEntity stop = stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, tenantId)
                .orElseThrow(() -> new RuntimeException("Stop not found"));

        if (req.status() != null) stop.setStatus(req.status());
        if (req.notes()  != null) stop.setNotes(req.notes());
        stopRepo.save(stop);

        return get(visitId);
    }

    public ServiceVisitResponse removeStop(UUID visitId, UUID stopId) {
        UUID tenantId = currentTenantId();
        ServiceVisitStopEntity stop = stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, tenantId)
                .orElseThrow(() -> new RuntimeException("Stop not found"));
        stop.setDeleted(true);
        stopRepo.save(stop);
        return get(visitId);
    }

    // ── Due Wells ─────────────────────────────────────────────────────────────

    public List<DueWellResponse> getDueWells(LocalDate date) {
        UUID tenantId = currentTenantId();
        List<TreatmentPlanEntity> activePlans =
                planRepo.findAllByTenantIdAndStatusAndIsDeletedFalse(tenantId, TreatmentPlanStatus.ACTIVE);

        List<DueWellResponse> result = new ArrayList<>();
        for (TreatmentPlanEntity plan : activePlans) {
            if (plan.getWellId() == null) continue;

            // Find the dominant schedule across plan lines — use the plan-level schedule if stored,
            // else default to DAILY (most conservative for suggestions)
            TreatmentPlanSchedule schedule = TreatmentPlanSchedule.DAILY;

            Optional<LocalDate> lastVisit =
                    stopRepo.findLastCompletedVisitDateForWell(tenantId, plan.getWellId());

            if (!isDue(schedule, lastVisit.orElse(null), date)) continue;

            WellEntity well = wellRepo.findById(plan.getWellId()).orElse(null);
            if (well == null) continue;

            String leaseName = leaseRepo.findById(well.getLeaseId())
                    .map(l -> l.getLeaseName()).orElse("—");

            result.add(new DueWellResponse(
                    well.getId(),
                    well.getWellName(),
                    leaseName,
                    plan.getId(),
                    schedule.name(),
                    lastVisit.orElse(null),
                    lastVisit.map(lv -> ChronoUnit.DAYS.between(lv, date)).orElse(null)
            ));
        }
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isDue(TreatmentPlanSchedule schedule, LocalDate lastVisit, LocalDate today) {
        if (lastVisit == null) return true;
        long days = ChronoUnit.DAYS.between(lastVisit, today);
        return switch (schedule) {
            case DAILY    -> true;
            case WEEKLY   -> days >= 7;
            case BIWEEKLY -> days >= 14;
            case MONTHLY  -> days >= 28;
        };
    }

    private ServiceVisitResponse toResponse(ServiceVisitEntity v, boolean includeStops) {
        String techName = userRepo.findById(v.getTechId())
                .map(u -> u.getFullName()).orElse("Unknown");

        List<ServiceVisitStopResponse> stops = Collections.emptyList();
        if (includeStops) {
            stops = stopRepo.findAllByServiceVisitIdAndIsDeletedFalseOrderBySequenceAsc(v.getId())
                    .stream().map(this::toStopResponse).toList();
        }

        return new ServiceVisitResponse(
                v.getId(), v.getName(), v.getVisitDate(), v.getTechId(), techName,
                v.getStatus(), v.getNotes(), stops, v.getCreatedAt()
        );
    }

    private ServiceVisitStopResponse toStopResponse(ServiceVisitStopEntity s) {
        WellEntity well = wellRepo.findById(s.getWellId()).orElse(null);
        String wellName   = well != null ? well.getWellName() : "—";
        String leaseName  = "—";
        String clientName = "—";
        if (well != null) {
            var lease = leaseRepo.findById(well.getLeaseId()).orElse(null);
            if (lease != null) {
                leaseName  = lease.getLeaseName();
                clientName = clientRepo.findById(lease.getClientId())
                        .map(c -> c.getCompanyName()).orElse("—");
            }
        }
        var report           = reportRepo.findByServiceVisitStopIdAndIsDeletedFalse(s.getId());
        boolean hasSoar          = report.map(r -> r.isSoar()).orElse(false);
        boolean soarAcknowledged = report.map(r -> r.getSoarAckAt() != null).orElse(false);
        boolean hasReport        = report.isPresent();
        return new ServiceVisitStopResponse(
                s.getId(), s.getWellId(), wellName, leaseName, clientName,
                s.getSequence(), s.getStatus(),
                hasSoar, soarAcknowledged, hasReport, s.getNotes()
        );
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findById(UUID.fromString(userId)).get().getTenantId();
    }

    private UUID currentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
