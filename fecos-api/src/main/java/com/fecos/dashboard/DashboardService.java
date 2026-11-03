package com.fecos.dashboard;

import com.fecos.clients.ClientRepository;
import com.fecos.lab.ApprovalStatus;
import com.fecos.lab.LabResultRepository;
import com.fecos.lab.LabSampleRepository;
import com.fecos.lab.LabSampleStatus;
import com.fecos.leases.LeaseRepository;
import com.fecos.routes.RouteRepository;
import com.fecos.routes.RouteStatus;
import com.fecos.servicereports.ServiceReportRepository;
import com.fecos.servicevisits.ServiceVisitRepository;
import com.fecos.servicevisits.ServiceVisitStatus;
import com.fecos.tanks.TankEntity;
import com.fecos.tanks.TankRepository;
import com.fecos.tanks.TankService;
import com.fecos.tanks.TankStatus;
import com.fecos.users.Role;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClientRepository     clientRepository;
    private final WellRepository       wellRepository;
    private final TankRepository       tankRepository;
    private final TankService          tankService;
    private final ServiceVisitRepository visitRepository;
    private final RouteRepository      routeRepository;
    private final LabSampleRepository  labSampleRepository;
    private final LabResultRepository  labResultRepository;
    private final ServiceReportRepository serviceReportRepository;
    private final LeaseRepository      leaseRepository;
    private final UserRepository       userRepository;

    public DashboardResponse get() {
        UUID userId = currentUserId();
        var  caller = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
        UUID tenantId = caller.getTenantId();
        Role role     = caller.getRole();
        LocalDate today = LocalDate.now();

        return switch (role) {
            case ADMIN       -> buildAdmin(tenantId, today);
            case MANAGER     -> buildManager(tenantId, today);
            case LAB_TECH    -> buildLabTech(tenantId, today);
            case ACCOUNT_REP -> buildAccountRep(tenantId, userId, today);
            default          -> empty();
        };
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    private DashboardResponse buildAdmin(UUID tenantId, LocalDate today) {
        TankCounts tc = tankCounts(tenantId, null);

        return new DashboardResponse(
                clientRepository.countByTenantIdAndIsDeletedFalse(tenantId),
                clientRepository.countByTenantIdAndIsActiveAndIsDeletedFalse(tenantId, true),
                wellRepository.countByTenantIdAndIsDeletedFalse(tenantId),
                tankRepository.countByTenantIdAndIsDeletedFalse(tenantId),
                visitRepository.countByTenantIdAndVisitDateAndIsDeletedFalse(tenantId, today),
                visitRepository.countByTenantIdAndStatusAndVisitDateAndIsDeletedFalse(tenantId, ServiceVisitStatus.IN_PROGRESS, today),
                visitRepository.countByTenantIdAndStatusAndVisitDateAndIsDeletedFalse(tenantId, ServiceVisitStatus.COMPLETED, today),
                activeRoutes(tenantId, today),
                routeRepository.countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(tenantId, RouteStatus.COMPLETED, today),
                labPending(tenantId),
                labSampleRepository.countCompletedSince(tenantId, today.atStartOfDay()),
                labResultRepository.countByTenantIdAndApprovalStatusAndIsDeletedFalse(tenantId, ApprovalStatus.PENDING_REVIEW),
                labResultRepository.countByTenantIdAndHasCriticalValuesTrueAndIsDeletedFalse(tenantId),
                tc.critical(), tc.warning(), tc.healthy(),
                serviceReportRepository.countByTenantIdAndSoarTrueAndSoarAckByIsNullAndIsDeletedFalse(tenantId),
                0, 0, 0, 0,   // lab-tech only
                0, 0, 0, 0, 0, 0, 0, 0  // account-rep only
        );
    }

    // ── MANAGER ───────────────────────────────────────────────────────────────

    private DashboardResponse buildManager(UUID tenantId, LocalDate today) {
        TankCounts tc = tankCounts(tenantId, null);

        return new DashboardResponse(
                clientRepository.countByTenantIdAndIsDeletedFalse(tenantId),
                clientRepository.countByTenantIdAndIsActiveAndIsDeletedFalse(tenantId, true),
                wellRepository.countByTenantIdAndIsDeletedFalse(tenantId),
                tankRepository.countByTenantIdAndIsDeletedFalse(tenantId),
                visitRepository.countByTenantIdAndVisitDateAndIsDeletedFalse(tenantId, today),
                visitRepository.countByTenantIdAndStatusAndVisitDateAndIsDeletedFalse(tenantId, ServiceVisitStatus.IN_PROGRESS, today),
                visitRepository.countByTenantIdAndStatusAndVisitDateAndIsDeletedFalse(tenantId, ServiceVisitStatus.COMPLETED, today),
                activeRoutes(tenantId, today),
                routeRepository.countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(tenantId, RouteStatus.COMPLETED, today),
                labPending(tenantId),
                labSampleRepository.countCompletedSince(tenantId, today.atStartOfDay()),
                labResultRepository.countByTenantIdAndApprovalStatusAndIsDeletedFalse(tenantId, ApprovalStatus.PENDING_REVIEW),
                labResultRepository.countByTenantIdAndHasCriticalValuesTrueAndIsDeletedFalse(tenantId),
                tc.critical(), tc.warning(), tc.healthy(),
                serviceReportRepository.countByTenantIdAndSoarTrueAndSoarAckByIsNullAndIsDeletedFalse(tenantId),
                0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0
        );
    }

    // ── LAB_TECH ──────────────────────────────────────────────────────────────

    private DashboardResponse buildLabTech(UUID tenantId, LocalDate today) {
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime cutoff    = todayStart; // overdue = received before today and still open

        return new DashboardResponse(
                0, 0, 0, 0, 0, 0, 0, 0, 0,
                labPending(tenantId),
                labSampleRepository.countCompletedSince(tenantId, todayStart),
                labResultRepository.countByTenantIdAndApprovalStatusAndIsDeletedFalse(tenantId, ApprovalStatus.PENDING_REVIEW),
                labResultRepository.countByTenantIdAndHasCriticalValuesTrueAndIsDeletedFalse(tenantId),
                0, 0, 0, // tank counts (not shown for lab tech)
                serviceReportRepository.countByTenantIdAndSoarTrueAndSoarAckByIsNullAndIsDeletedFalse(tenantId),
                labSampleRepository.countByTenantIdAndStatusAndIsDeletedFalse(tenantId, LabSampleStatus.RECEIVED),
                labSampleRepository.countByTenantIdAndStatusAndIsDeletedFalse(tenantId, LabSampleStatus.IN_PROGRESS),
                labSampleRepository.countCompletedSince(tenantId, todayStart),
                labSampleRepository.countOverdue(tenantId, cutoff),
                0, 0, 0, 0, 0, 0, 0, 0
        );
    }

    // ── ACCOUNT_REP ───────────────────────────────────────────────────────────

    private DashboardResponse buildAccountRep(UUID tenantId, UUID repId, LocalDate today) {
        List<UUID> clientIds = clientRepository.findIdsByTenantIdAndAccountRepId(tenantId, repId);
        if (clientIds.isEmpty()) return emptyRep(tenantId);

        List<UUID> leaseIds = leaseRepository.findIdsByTenantIdAndClientIdIn(tenantId, clientIds);
        List<UUID> wellIds  = leaseIds.isEmpty()
                ? Collections.emptyList()
                : wellRepository.findIdsByTenantIdAndLeaseIdIn(tenantId, leaseIds);

        TankCounts tc = wellIds.isEmpty()
                ? new TankCounts(0, 0, 0)
                : tankCounts(tenantId, wellIds);

        long myLabPending = wellIds.isEmpty() ? 0
                : labSampleRepository.countByTenantIdAndWellIdInAndStatusAndIsDeletedFalse(tenantId, wellIds, LabSampleStatus.RECEIVED)
                + labSampleRepository.countByTenantIdAndWellIdInAndStatusAndIsDeletedFalse(tenantId, wellIds, LabSampleStatus.IN_PROGRESS);

        return new DashboardResponse(
                0, 0, 0, 0, 0,
                visitRepository.countByTenantIdAndStatusAndVisitDateAndIsDeletedFalse(tenantId, ServiceVisitStatus.IN_PROGRESS, today),
                visitRepository.countByTenantIdAndStatusAndVisitDateAndIsDeletedFalse(tenantId, ServiceVisitStatus.COMPLETED, today),
                0, 0, 0, 0, 0, 0,
                tc.critical(), tc.warning(), tc.healthy(),
                serviceReportRepository.countByTenantIdAndSoarTrueAndSoarAckByIsNullAndIsDeletedFalse(tenantId),
                0, 0, 0, 0,
                (long) clientIds.size(),
                clientRepository.countByTenantIdAndAccountRepIdAndIsActiveAndIsDeletedFalse(tenantId, repId, true),
                wellIds.isEmpty() ? 0 : wellRepository.countByTenantIdAndLeaseIdInAndIsDeletedFalse(tenantId, leaseIds),
                tc.critical(), tc.warning(), tc.healthy(),
                myLabPending,
                serviceReportRepository.countByTenantIdAndSoarTrueAndSoarAckByIsNullAndIsDeletedFalse(tenantId)
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private record TankCounts(long critical, long warning, long healthy) {}

    // tanks in ASSIGNED or INSTALLED status are "in service" and should be health-monitored
    private static final List<TankStatus> IN_SERVICE = List.of(TankStatus.ASSIGNED, TankStatus.INSTALLED);

    private TankCounts tankCounts(UUID tenantId, List<UUID> wellIds) {
        List<TankEntity> tanks = wellIds == null
                ? tankRepository.findAllByTenantIdAndStatusInAndIsDeletedFalse(tenantId, IN_SERVICE)
                : tankRepository.findAllByTenantIdAndWellIdInAndStatusInAndIsDeletedFalse(tenantId, wellIds, IN_SERVICE);

        long critical = 0, warning = 0, healthy = 0;
        for (TankEntity t : tanks) {
            BigDecimal pct = tankService.getCalculatedLevel(t.getId());
            double v = pct == null ? 0 : pct.doubleValue();
            if (v < 30)      critical++;
            else if (v < 60) warning++;
            else             healthy++;
        }
        return new TankCounts(critical, warning, healthy);
    }

    private long labPending(UUID tenantId) {
        return labSampleRepository.countByTenantIdAndStatusAndIsDeletedFalse(tenantId, LabSampleStatus.RECEIVED)
             + labSampleRepository.countByTenantIdAndStatusAndIsDeletedFalse(tenantId, LabSampleStatus.IN_PROGRESS);
    }

    private long activeRoutes(UUID tenantId, LocalDate today) {
        return routeRepository.countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(tenantId, RouteStatus.IN_PROGRESS, today)
             + routeRepository.countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(tenantId, RouteStatus.DISPATCHED, today);
    }

    private DashboardResponse empty() {
        return new DashboardResponse(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    }

    private DashboardResponse emptyRep(UUID tenantId) {
        // rep with no clients — still show SOAR/tank counts for awareness
        TankCounts tc = tankCounts(tenantId, null);
        long soar = serviceReportRepository.countByTenantIdAndSoarTrueAndSoarAckByIsNullAndIsDeletedFalse(tenantId);
        return new DashboardResponse(0,0,0,0,0,0,0,0,0,0,0,0,0,tc.critical(),tc.warning(),tc.healthy(),soar,0,0,0,0,0,0,0,0,0,0,0,0);
    }

    private UUID currentUserId() {
        return UUID.fromString(SecurityContextHolder.getContext().getAuthentication().getName());
    }

}
