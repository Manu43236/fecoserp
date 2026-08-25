package com.fecos.dashboard;

import com.fecos.clients.ClientRepository;
import com.fecos.lab.LabSampleRepository;
import com.fecos.lab.LabSampleStatus;
import com.fecos.routes.RouteRepository;
import com.fecos.routes.RouteStatus;
import com.fecos.servicereports.ServiceReportRepository;
import com.fecos.servicevisits.ServiceVisitRepository;
import com.fecos.servicevisits.ServiceVisitStatus;
import com.fecos.tanks.TankRepository;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClientRepository clientRepository;
    private final WellRepository wellRepository;
    private final TankRepository tankRepository;
    private final ServiceVisitRepository visitRepository;
    private final RouteRepository routeRepository;
    private final LabSampleRepository labSampleRepository;
    private final ServiceReportRepository serviceReportRepository;
    private final UserRepository userRepository;

    public DashboardResponse get() {
        UUID tenantId = currentTenantId();
        LocalDate today = LocalDate.now();

        long totalClients   = clientRepository.countByTenantIdAndIsDeletedFalse(tenantId);
        long totalWells     = wellRepository.countByTenantIdAndIsDeletedFalse(tenantId);
        long totalTanks     = tankRepository.countByTenantIdAndIsDeletedFalse(tenantId);

        long activeVisits    = visitRepository.countByTenantIdAndStatusAndVisitDateAndIsDeletedFalse(tenantId, ServiceVisitStatus.IN_PROGRESS, today);
        long completedVisits = visitRepository.countByTenantIdAndStatusAndVisitDateAndIsDeletedFalse(tenantId, ServiceVisitStatus.COMPLETED, today);

        long activeRoutes    = routeRepository.countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(tenantId, RouteStatus.IN_PROGRESS, today)
                             + routeRepository.countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(tenantId, RouteStatus.DISPATCHED, today);
        long completedRoutes = routeRepository.countByTenantIdAndStatusAndRouteDateAndIsDeletedFalse(tenantId, RouteStatus.COMPLETED, today);

        long labPending   = labSampleRepository.countByTenantIdAndStatusAndIsDeletedFalse(tenantId, LabSampleStatus.RECEIVED)
                          + labSampleRepository.countByTenantIdAndStatusAndIsDeletedFalse(tenantId, LabSampleStatus.IN_PROGRESS);
        long labCompleted = labSampleRepository.countByTenantIdAndStatusAndIsDeletedFalse(tenantId, LabSampleStatus.COMPLETED);

        long soarUnacked = serviceReportRepository.countByTenantIdAndSoarTrueAndSoarAckByIsNullAndIsDeletedFalse(tenantId);

        return new DashboardResponse(
                totalClients, activeVisits, completedVisits,
                activeRoutes, completedRoutes,
                labPending, labCompleted, soarUnacked,
                totalWells, totalTanks
        );
    }

    private UUID currentTenantId() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"))
                .getTenantId();
    }
}
