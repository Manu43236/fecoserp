package com.fecos.routes;

import com.fecos.leases.LeaseRepository;
import com.fecos.products.ProductRepository;
import com.fecos.users.UserRepository;
import com.fecos.wells.WellRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final RouteStopRepository stopRepository;
    private final RouteStopItemRepository itemRepository;
    private final UserRepository userRepository;
    private final LeaseRepository leaseRepository;
    private final WellRepository wellRepository;
    private final ProductRepository productRepository;

    public Page<RouteResponse> list(RouteStatus status, UUID driverId, LocalDate routeDate, int page, int size) {
        UUID tenantId = currentTenantId();
        return routeRepository.search(tenantId, status, driverId, routeDate, PageRequest.of(page, size))
                .map(r -> toResponse(r, false));
    }

    public RouteResponse findById(UUID id) {
        return toResponse(findForTenant(id), true);
    }

    @Transactional
    public RouteResponse create(RouteRequest req) {
        UUID tenantId = currentTenantId();
        RouteEntity r = new RouteEntity();
        r.setTenantId(tenantId);
        r.setCreatedBy(currentUserId());
        apply(r, req);
        return toResponse(routeRepository.save(r), false);
    }

    @Transactional
    public RouteResponse update(UUID id, RouteRequest req) {
        RouteEntity r = findForTenant(id);
        apply(r, req);
        return toResponse(routeRepository.save(r), true);
    }

    @Transactional
    public void delete(UUID id) {
        RouteEntity r = findForTenant(id);
        r.setDeleted(true);
        routeRepository.save(r);
    }

    @Transactional
    public RouteResponse addStop(UUID routeId, RouteStopRequest req) {
        UUID tenantId = currentTenantId();
        RouteEntity r = findForTenant(routeId);

        int nextOrder = stopRepository.countByRouteIdAndIsDeletedFalse(routeId) + 1;

        RouteStopEntity stop = new RouteStopEntity();
        stop.setTenantId(tenantId);
        stop.setCreatedBy(currentUserId());
        stop.setRouteId(routeId);
        stop.setLeaseId(req.getLeaseId());
        stop.setWellId(req.getWellId());
        stop.setSequenceOrder(nextOrder);
        stop.setNotes(req.getNotes());
        RouteStopEntity saved = stopRepository.save(stop);

        if (req.getItems() != null) {
            for (RouteStopItemRequest ir : req.getItems()) {
                RouteStopItemEntity item = new RouteStopItemEntity();
                item.setTenantId(tenantId);
                item.setCreatedBy(currentUserId());
                item.setStopId(saved.getId());
                item.setProductId(ir.getProductId());
                item.setQuantity(ir.getQuantity());
                item.setUnit(ir.getUnit());
                item.setNotes(ir.getNotes());
                itemRepository.save(item);
            }
        }

        return toResponse(r, true);
    }

    @Transactional
    public RouteResponse removeStop(UUID routeId, UUID stopId) {
        RouteEntity r = findForTenant(routeId);
        RouteStopEntity stop = stopRepository.findByIdAndRouteIdAndIsDeletedFalse(stopId, routeId)
                .orElseThrow(() -> new EntityNotFoundException("Stop not found"));
        stop.setDeleted(true);
        stopRepository.save(stop);
        return toResponse(r, true);
    }

    @Transactional
    public RouteResponse addItem(UUID routeId, UUID stopId, RouteStopItemRequest req) {
        UUID tenantId = currentTenantId();
        RouteEntity r = findForTenant(routeId);
        stopRepository.findByIdAndRouteIdAndIsDeletedFalse(stopId, routeId)
                .orElseThrow(() -> new EntityNotFoundException("Stop not found"));

        RouteStopItemEntity item = new RouteStopItemEntity();
        item.setTenantId(tenantId);
        item.setCreatedBy(currentUserId());
        item.setStopId(stopId);
        item.setProductId(req.getProductId());
        item.setQuantity(req.getQuantity());
        item.setUnit(req.getUnit());
        item.setNotes(req.getNotes());
        itemRepository.save(item);

        return toResponse(r, true);
    }

    @Transactional
    public RouteResponse removeItem(UUID routeId, UUID stopId, UUID itemId) {
        RouteEntity r = findForTenant(routeId);
        stopRepository.findByIdAndRouteIdAndIsDeletedFalse(stopId, routeId)
                .orElseThrow(() -> new EntityNotFoundException("Stop not found"));
        RouteStopItemEntity item = itemRepository.findByIdAndStopIdAndIsDeletedFalse(itemId, stopId)
                .orElseThrow(() -> new EntityNotFoundException("Item not found"));
        item.setDeleted(true);
        itemRepository.save(item);
        return toResponse(r, true);
    }

    @Transactional
    public RouteResponse updateStatus(UUID routeId, RouteStatus status) {
        RouteEntity r = findForTenant(routeId);
        r.setStatus(status);
        return toResponse(routeRepository.save(r), true);
    }

    @Transactional
    public RouteResponse updateStopStatus(UUID routeId, UUID stopId, RouteStopStatus status) {
        RouteEntity r = findForTenant(routeId);
        RouteStopEntity stop = stopRepository.findByIdAndRouteIdAndIsDeletedFalse(stopId, routeId)
                .orElseThrow(() -> new EntityNotFoundException("Stop not found"));
        stop.setStatus(status);
        stopRepository.save(stop);
        return toResponse(r, true);
    }

    private void apply(RouteEntity r, RouteRequest req) {
        r.setDriverId(req.getDriverId());
        r.setTruckNumber(req.getTruckNumber());
        r.setRouteDate(req.getRouteDate());
        r.setStatus(req.getStatus() != null ? req.getStatus() : RouteStatus.PLANNED);
        r.setNotes(req.getNotes());
    }

    private RouteResponse toResponse(RouteEntity r, boolean includeStops) {
        String driverName = userRepository.findById(r.getDriverId())
                .map(u -> u.getFullName()).orElse(null);

        int stopCount = stopRepository.countByRouteIdAndIsDeletedFalse(r.getId());

        List<RouteStopResponse> stops = List.of();
        if (includeStops) {
            stops = stopRepository.findAllByRouteIdAndIsDeletedFalseOrderBySequenceOrderAsc(r.getId())
                    .stream()
                    .map(s -> {
                        String leaseName = leaseRepository.findByIdAndTenantIdAndIsDeletedFalse(s.getLeaseId(), r.getTenantId())
                                .map(l -> l.getLeaseName()).orElse(null);
                        String wellName = wellRepository.findByIdAndTenantIdAndIsDeletedFalse(s.getWellId(), r.getTenantId())
                                .map(w -> w.getWellName()).orElse(null);
                        List<RouteStopItemResponse> items = itemRepository
                                .findAllByStopIdAndIsDeletedFalseOrderByCreatedAtAsc(s.getId())
                                .stream()
                                .map(i -> {
                                    String productName = productRepository.findById(i.getProductId())
                                            .map(p -> p.getName()).orElse(null);
                                    return RouteStopItemResponse.from(i, productName);
                                })
                                .toList();
                        return RouteStopResponse.from(s, leaseName, wellName, items);
                    })
                    .toList();
        }

        return RouteResponse.from(r, driverName, stopCount, stops);
    }

    private RouteEntity findForTenant(UUID id) {
        return routeRepository.findByIdAndTenantIdAndIsDeletedFalse(id, currentTenantId())
                .orElseThrow(() -> new EntityNotFoundException("Route not found"));
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
