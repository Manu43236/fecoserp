package com.fecos.servicereports;

import com.fecos.leases.LeaseRepository;
import com.fecos.servicevisits.ServiceVisitRepository;
import com.fecos.servicevisits.ServiceVisitStopRepository;
import com.fecos.servicevisits.ServiceVisitStopStatus;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellEntity;
import com.fecos.wells.WellRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ServiceReportService {

    private final ServiceReportRepository reportRepo;
    private final ServiceReportChemicalRepository chemRepo;
    private final ServiceVisitStopRepository stopRepo;
    private final ServiceVisitRepository visitRepo;
    private final UserRepository userRepo;
    private final WellRepository wellRepo;
    private final LeaseRepository leaseRepo;

    // ── Submit report for a stop ──────────────────────────────────────────────

    @Transactional
    public ServiceReportResponse submit(UUID visitId, UUID stopId, ServiceReportRequest req) {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();

        stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, tenantId)
                .orElseThrow(() -> new RuntimeException("Stop not found"));

        ServiceReportEntity report = reportRepo
                .findByServiceVisitStopIdAndIsDeletedFalse(stopId)
                .orElseGet(() -> {
                    ServiceReportEntity r = new ServiceReportEntity();
                    r.setId(UUID.randomUUID());
                    r.setTenantId(tenantId);
                    r.setServiceVisitStopId(stopId);
                    r.setCreatedBy(userId);
                    return r;
                });

        report.setPumpRunning(req.pumpRunning());
        report.setTankLevelBefore(req.tankLevelBefore());
        report.setTankLevelAfter(req.tankLevelAfter());
        report.setActualRate(req.actualRate());
        report.setSoar(req.soar());
        report.setSpecialTreat(req.specialTreat());
        report.setNotes(req.notes());

        if (req.soar()) {
            report.setSubmittedAt(Instant.now());
            // mark stop as completed
            stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, tenantId).ifPresent(s -> {
                s.setStatus(ServiceVisitStopStatus.COMPLETED);
                stopRepo.save(s);
            });
        }

        reportRepo.save(report);

        // replace chemicals
        chemRepo.findAllByServiceReportIdAndIsDeletedFalseOrderBySortOrderAsc(report.getId())
                .forEach(c -> { c.setDeleted(true); chemRepo.save(c); });

        if (req.chemicals() != null) {
            int order = 1;
            for (ServiceReportChemicalRequest cr : req.chemicals()) {
                ServiceReportChemicalEntity c = new ServiceReportChemicalEntity();
                c.setId(UUID.randomUUID());
                c.setTenantId(tenantId);
                c.setServiceReportId(report.getId());
                c.setProductId(cr.productId());
                c.setProductName(cr.productName());
                c.setGallonsDelivered(cr.gallonsDelivered());
                c.setGallonsOnHand(cr.gallonsOnHand());
                c.setRecRate(cr.recRate());
                c.setActualRate(cr.actualRate());
                c.setOnRate(cr.onRate());
                c.setSoar(cr.soar());
                c.setComments(cr.comments());
                c.setSortOrder(order++);
                c.setCreatedBy(userId);
                chemRepo.save(c);
            }
        }

        return toResponse(report);
    }

    // ── Get report for a stop ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ServiceReportResponse getByStop(UUID stopId) {
        UUID tenantId = currentTenantId();
        ServiceReportEntity report = reportRepo
                .findByServiceVisitStopIdAndIsDeletedFalse(stopId)
                .orElseThrow(() -> new RuntimeException("No report filed for this stop"));
        if (!report.getTenantId().equals(tenantId)) throw new RuntimeException("Not found");
        return toResponse(report);
    }

    // ── List all reports (web - admin/manager) ────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ServiceReportResponse> list(int page, int size) {
        UUID tenantId = currentTenantId();
        return reportRepo.findAllByTenant(tenantId, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ── Dashboard summary for today (mobile - service tech) ──────────────────

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        UUID tenantId = currentTenantId();
        UUID techId   = currentUserId();
        LocalDate today = LocalDate.now();

        List<com.fecos.servicevisits.ServiceVisitEntity> visits =
                visitRepo.search(tenantId, null, techId, today, PageRequest.of(0, 100))
                        .getContent();

        int visitsTotal    = visits.size();
        int stopsTotal     = 0;
        int stopsCompleted = 0;

        for (var v : visits) {
            List<com.fecos.servicevisits.ServiceVisitStopEntity> stops =
                    stopRepo.findAllByServiceVisitIdAndIsDeletedFalseOrderBySequenceAsc(v.getId());
            stopsTotal += stops.size();
            stopsCompleted += (int) stops.stream()
                    .filter(s -> s.getStatus() == ServiceVisitStopStatus.COMPLETED)
                    .count();
        }

        return new DashboardResponse(false, visitsTotal, stopsCompleted, stopsTotal, today);
    }

    // ── My visits for today (mobile - service tech) ───────────────────────────

    @Transactional(readOnly = true)
    public List<MyVisitResponse> myVisits(String date) {
        UUID tenantId = currentTenantId();
        UUID techId   = currentUserId();

        java.time.LocalDate visitDate = date != null
                ? java.time.LocalDate.parse(date)
                : java.time.LocalDate.now();

        return visitRepo.search(tenantId, null, techId, visitDate, PageRequest.of(0, 50))
                .getContent().stream()
                .map(this::toMyVisitResponse)
                .toList();
    }

    // ── Upcoming visits (mobile - service tech) ───────────────────────────────

    @Transactional(readOnly = true)
    public List<MyVisitResponse> upcomingVisits() {
        UUID tenantId = currentTenantId();
        UUID techId   = currentUserId();
        return visitRepo.findUpcomingForTech(tenantId, techId, LocalDate.now())
                .stream()
                .map(this::toMyVisitResponse)
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private MyVisitResponse toMyVisitResponse(com.fecos.servicevisits.ServiceVisitEntity v) {
        List<MyVisitStopResponse> stops =
                stopRepo.findAllByServiceVisitIdAndIsDeletedFalseOrderBySequenceAsc(v.getId())
                        .stream()
                        .map(s -> {
                            WellEntity well = wellRepo.findById(s.getWellId()).orElse(null);
                            String wellName  = well != null ? well.getWellName() : "—";
                            String leaseName = well != null
                                    ? leaseRepo.findById(well.getLeaseId()).map(l -> l.getLeaseName()).orElse("—")
                                    : "—";
                            boolean hasReport = reportRepo
                                    .findByServiceVisitStopIdAndIsDeletedFalse(s.getId())
                                    .isPresent();
                            return new MyVisitStopResponse(
                                    s.getId(), s.getWellId(), wellName, leaseName,
                                    s.getSequence(), s.getStatus().name(),
                                    s.isSampleCollected(), hasReport
                            );
                        }).toList();
        return new MyVisitResponse(v.getId(), v.getVisitDate().toString(), v.getStatus().name(), stops);
    }

    private ServiceReportResponse toResponse(ServiceReportEntity r) {
        List<ServiceReportChemicalResponse> chemicals =
                chemRepo.findAllByServiceReportIdAndIsDeletedFalseOrderBySortOrderAsc(r.getId())
                        .stream()
                        .map(c -> new ServiceReportChemicalResponse(
                                c.getId(), c.getProductId(), c.getProductName(),
                                c.getGallonsDelivered(), c.getGallonsOnHand(),
                                c.getRecRate(), c.getActualRate(),
                                c.isOnRate(), c.isSoar(), c.getComments(), c.getSortOrder()
                        )).toList();

        var stop = stopRepo.findByIdAndTenantIdAndIsDeletedFalse(
                r.getServiceVisitStopId(), r.getTenantId()).orElse(null);
        String wellName  = "—";
        String leaseName = "—";
        String techName  = "—";

        if (stop != null) {
            WellEntity well = wellRepo.findById(stop.getWellId()).orElse(null);
            if (well != null) {
                wellName  = well.getWellName();
                leaseName = leaseRepo.findById(well.getLeaseId()).map(l -> l.getLeaseName()).orElse("—");
            }
            var visit = visitRepo.findByIdAndTenantIdAndIsDeletedFalse(
                    stop.getServiceVisitId(), r.getTenantId()).orElse(null);
            if (visit != null) {
                techName = userRepo.findById(visit.getTechId()).map(u -> u.getFullName()).orElse("—");
            }
        }

        return new ServiceReportResponse(
                r.getId(), r.getServiceVisitStopId(), wellName, leaseName, techName,
                r.isPumpRunning(), r.getTankLevelBefore(), r.getTankLevelAfter(),
                r.getActualRate(), r.isSoar(), r.getSpecialTreat(), r.getNotes(),
                chemicals, r.getSubmittedAt(), r.getCreatedAt()
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
