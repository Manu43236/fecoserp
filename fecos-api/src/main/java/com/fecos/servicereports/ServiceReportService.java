package com.fecos.servicereports;

import com.fecos.clients.ClientRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.programs.TreatmentPlanLineRepository;
import com.fecos.servicevisits.ServiceVisitRepository;
import com.fecos.servicevisits.ServiceVisitStopRepository;
import com.fecos.servicevisits.ServiceVisitStopStatus;
import com.fecos.tanks.TankRepository;
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
    private final ServiceReportTreatmentLineRepository treatLineRepo;
    private final ServiceVisitStopRepository stopRepo;
    private final ServiceVisitRepository visitRepo;
    private final UserRepository userRepo;
    private final WellRepository wellRepo;
    private final LeaseRepository leaseRepo;
    private final ClientRepository clientRepo;
    private final TreatmentPlanLineRepository planLineRepo;
    private final TankRepository tankRepo;

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
                visitRepo.search(tenantId, null, techId, today, today, PageRequest.of(0, 100))
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

        LocalDate weekStart = today.with(java.time.DayOfWeek.MONDAY);
        List<com.fecos.servicevisits.ServiceVisitEntity> weekVisits =
                visitRepo.search(tenantId, null, techId, weekStart, today, PageRequest.of(0, 500))
                        .getContent();
        int weekVisitsTotal = weekVisits.size();
        int weekStopsTotal  = 0;
        for (var v : weekVisits) {
            weekStopsTotal += stopRepo
                    .findAllByServiceVisitIdAndIsDeletedFalseOrderBySequenceAsc(v.getId()).size();
        }

        return new DashboardResponse(false, visitsTotal, stopsCompleted, stopsTotal, today,
                weekVisitsTotal, weekStopsTotal);
    }

    // ── My visits for today (mobile - service tech) ───────────────────────────

    @Transactional(readOnly = true)
    public List<MyVisitResponse> myVisits(String date) {
        UUID tenantId = currentTenantId();
        UUID techId   = currentUserId();

        java.time.LocalDate visitDate = date != null
                ? java.time.LocalDate.parse(date)
                : java.time.LocalDate.now();

        return visitRepo.search(tenantId, null, techId, visitDate, visitDate, PageRequest.of(0, 50))
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

    // ── Submit treatment report for a stop (mobile Phase 2) ──────────────────

    @Transactional
    public TreatmentReportResponse submitTreatmentReport(UUID visitId, UUID stopId, TreatmentReportRequest req) {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();

        stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, tenantId)
                .orElseThrow(() -> new RuntimeException("Stop not found"));

        // upsert the service_reports header row
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

        report.setPerformedAt(req.performedAt());
        report.setGpsLat(req.gpsLat());
        report.setGpsLng(req.gpsLng());
        report.setGpsCapturedAt(req.gpsCapturedAt());
        report.setPhotoUrl(req.photoUrl());
        report.setPhotoCapturedAt(req.photoCapturedAt());
        report.setSoar(req.soar());
        report.setSoarNote(req.soarNote());
        report.setSampleType(req.sampleType());
        report.setSampleNotes(req.sampleNotes());
        report.setSamplePhotoUrl(req.samplePhotoUrl());
        report.setSignatureUrl(req.signatureUrl());
        report.setSignerName(req.signerName());
        report.setSignedAt(req.signedAt());
        report.setNotes(req.notes());
        report.setSubmittedAt(Instant.now());

        // Track when offline data arrived vs when the inspection actually happened
        if (req.syncedAt() != null) {
            report.setSyncedAt(req.syncedAt());
            report.setSyncedLate(req.performedAt() != null &&
                    req.syncedAt().isAfter(req.performedAt().plusSeconds(1800)));
        }

        report = reportRepo.save(report); // capture returned managed instance — ID may differ from pre-merge entity

        // replace treatment lines
        treatLineRepo.findAllByServiceReportIdAndIsDeletedFalseOrderBySortOrderAsc(report.getId())
                .forEach(l -> { l.setDeleted(true); treatLineRepo.save(l); });

        if (req.lines() != null) {
            for (TreatmentReportRequest.TreatmentLineRequest lr : req.lines()) {
                ServiceReportTreatmentLineEntity line = new ServiceReportTreatmentLineEntity();
                line.setId(UUID.randomUUID());
                line.setTenantId(tenantId);
                line.setServiceReportId(report.getId());
                line.setPlanLineId(lr.planLineId());
                line.setTankId(lr.tankId());
                line.setMethod(lr.method());
                line.setPumpRunning(lr.pumpRunning());
                line.setRateFound(lr.rateFound());
                line.setRateSetTo(lr.rateSetTo());
                line.setOnRate(lr.onRate());
                line.setApplied(lr.applied());
                line.setQuantityApplied(lr.quantityApplied());
                line.setTankLevelPct(lr.tankLevelPct());
                line.setDeviationReason(lr.deviationReason());
                line.setPumpDownReason(lr.pumpDownReason());
                line.setProductName(lr.productName());
                line.setNotes(lr.notes());
                line.setRecordedAt(lr.recordedAt());
                line.setSortOrder(lr.sortOrder());
                line.setCreatedBy(userId);
                treatLineRepo.save(line);

                // update rec rate in treatment plan line if changed
                if ("CI".equalsIgnoreCase(lr.method()) && lr.rateSetTo() != null && lr.planLineId() != null) {
                    planLineRepo.findById(lr.planLineId()).ifPresent(pl -> {
                        if (pl.getRecRate().compareTo(lr.rateSetTo()) != 0) {
                            pl.setRecRatePrevious(pl.getRecRate());
                            pl.setRecRate(lr.rateSetTo());
                            pl.setRecRateUpdatedBy(userId);
                            pl.setRecRateUpdatedAt(Instant.now());
                            planLineRepo.save(pl);
                        }
                    });
                }
            }
        }

        // mark stop completed
        stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, tenantId).ifPresent(s -> {
            s.setStatus(ServiceVisitStopStatus.COMPLETED);
            stopRepo.save(s);
        });

        return toTreatmentReportResponse(report);
    }

    // ── Acknowledge SOAR (web - manager/admin) ────────────────────────────────

    @Transactional
    public TreatmentReportResponse acknowledgeSoar(UUID stopId, SoarAckRequest req) {
        UUID tenantId = currentTenantId();
        UUID userId   = currentUserId();

        ServiceReportEntity report = reportRepo
                .findByServiceVisitStopIdAndIsDeletedFalse(stopId)
                .orElseThrow(() -> new RuntimeException("No report filed for this stop"));
        if (!report.getTenantId().equals(tenantId)) throw new RuntimeException("Not found");
        if (!report.isSoar()) throw new RuntimeException("This stop does not have a SOAR flag");

        report.setSoarAckBy(userId);
        report.setSoarAckAt(Instant.now());
        report.setSoarAckNote(req.ackNote());
        reportRepo.save(report);

        return toTreatmentReportResponse(report);
    }

    // ── Get treatment report for a stop (mobile + web) ────────────────────────

    @Transactional(readOnly = true)
    public TreatmentReportResponse getTreatmentReport(UUID stopId) {
        UUID tenantId = currentTenantId();
        ServiceReportEntity report = reportRepo
                .findByServiceVisitStopIdAndIsDeletedFalse(stopId)
                .orElseThrow(() -> new RuntimeException("No report filed for this stop"));
        if (!report.getTenantId().equals(tenantId)) throw new RuntimeException("Not found");
        return toTreatmentReportResponse(report);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private MyVisitResponse toMyVisitResponse(com.fecos.servicevisits.ServiceVisitEntity v) {
        List<MyVisitStopResponse> stops =
                stopRepo.findAllByServiceVisitIdAndIsDeletedFalseOrderBySequenceAsc(v.getId())
                        .stream()
                        .map(s -> {
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
                            boolean hasReport = reportRepo
                                    .findByServiceVisitStopIdAndIsDeletedFalse(s.getId())
                                    .isPresent();
                            return new MyVisitStopResponse(
                                    s.getId(), s.getWellId(), wellName, leaseName, clientName,
                                    s.getSequence(), s.getStatus().name(),
                                    hasReport
                            );
                        }).toList();
        return new MyVisitResponse(v.getId(), v.getName(), v.getVisitDate().toString(), v.getStatus().name(), stops);
    }

    private TreatmentReportResponse toTreatmentReportResponse(ServiceReportEntity r) {
        List<TreatmentReportResponse.TreatmentLineResponse> lines =
                treatLineRepo.findAllByServiceReportIdAndIsDeletedFalseOrderBySortOrderAsc(r.getId())
                        .stream()
                        .map(l -> {
                            var tank = l.getTankId() != null
                                    ? tankRepo.findById(l.getTankId()).orElse(null)
                                    : null;
                            return new TreatmentReportResponse.TreatmentLineResponse(
                                    l.getId(), l.getPlanLineId(), l.getTankId(),
                                    tank != null ? tank.getSerialNumber() : null,
                                    tank != null ? tank.getCapacityGallons() : null,
                                    l.getProductName(),
                                    l.getMethod(),
                                    l.getPumpRunning(), l.getPumpDownReason(),
                                    l.getRateFound(), l.getRateSetTo(), l.getOnRate(),
                                    l.getDeviationReason(),
                                    l.getApplied(), l.getQuantityApplied(),
                                    l.getTankLevelPct(),
                                    l.getNotes(), l.getRecordedAt(), l.getSortOrder()
                            );
                        }).toList();

        String wellName = "—", leaseName = "—", clientName = "—", techName = "—";
        var stop = stopRepo.findByIdAndTenantIdAndIsDeletedFalse(r.getServiceVisitStopId(), r.getTenantId()).orElse(null);
        if (stop != null) {
            WellEntity well = wellRepo.findById(stop.getWellId()).orElse(null);
            if (well != null) {
                wellName = well.getWellName();
                var lease = leaseRepo.findById(well.getLeaseId()).orElse(null);
                if (lease != null) {
                    leaseName  = lease.getLeaseName();
                    clientName = clientRepo.findById(lease.getClientId())
                            .map(c -> c.getCompanyName()).orElse("—");
                }
            }
            var visit = visitRepo.findByIdAndTenantIdAndIsDeletedFalse(stop.getServiceVisitId(), r.getTenantId()).orElse(null);
            if (visit != null) techName = userRepo.findById(visit.getTechId()).map(u -> u.getFullName()).orElse("—");
        }

        String soarAckByName = r.getSoarAckBy() != null
                ? userRepo.findById(r.getSoarAckBy()).map(u -> u.getFullName()).orElse(null)
                : null;
        String soarAckAtStr = r.getSoarAckAt() != null ? r.getSoarAckAt().toString() : null;

        return new TreatmentReportResponse(
                r.getId(), r.getServiceVisitStopId(), wellName, leaseName, clientName, techName,
                r.getPerformedAt(), r.getGpsLat(), r.getGpsLng(), r.getGpsCapturedAt(),
                r.getPhotoUrl(), r.getPhotoCapturedAt(),
                r.isSoar(), r.getSoarNote(), soarAckByName, soarAckAtStr, r.getSoarAckNote(),
                r.getSampleType(), r.getSampleNotes(), r.getSamplePhotoUrl(),
                r.getSignatureUrl(), r.getSignerName(), r.getSignedAt(),
                r.getNotes(), r.getSubmittedAt(), r.getSyncedAt(), r.isSyncedLate(), lines
        );
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
                r.isSoar(), r.getSpecialTreat(), r.getNotes(),
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
