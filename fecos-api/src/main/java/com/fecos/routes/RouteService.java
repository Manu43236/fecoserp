package com.fecos.routes;

import com.fecos.inventory.InventoryService;
import com.fecos.inventory.WarehouseRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.products.ProductRepository;
import com.fecos.programs.TreatmentPlanLineRepository;
import com.fecos.programs.TreatmentPlanStatus;
import com.fecos.tanks.TankEventRequest;
import com.fecos.tanks.TankEventType;
import com.fecos.tanks.TankService;
import com.fecos.users.UserRepository;
import com.fecos.vehicles.VehicleRepository;
import com.fecos.wells.WellRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final RouteStopRepository stopRepository;
    private final RouteStopItemRepository itemRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final WarehouseRepository warehouseRepository;
    private final LeaseRepository leaseRepository;
    private final WellRepository wellRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final TreatmentPlanLineRepository planLineRepository;
    private final TankService tankService;

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
        RouteStatus prevStatus = r.getStatus();
        apply(r, req);
        RouteEntity saved = routeRepository.save(r);

        if (prevStatus != RouteStatus.DISPATCHED && saved.getStatus() == RouteStatus.DISPATCHED
                && saved.getWarehouseId() != null) {
            issueInventoryForRoute(saved);
        }
        if (saved.getStatus() == RouteStatus.CANCELLED
                && (prevStatus == RouteStatus.DISPATCHED || prevStatus == RouteStatus.IN_PROGRESS)) {
            inventoryService.reverseRouteIssues(
                    saved.getTenantId(), currentUserId(), currentUserName(), saved.getId());
        }

        return toResponse(saved, true);
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
        RouteStatus prevStatus = r.getStatus();
        r.setStatus(status);
        RouteEntity saved = routeRepository.save(r);

        if (prevStatus != RouteStatus.DISPATCHED && status == RouteStatus.DISPATCHED
                && saved.getWarehouseId() != null) {
            issueInventoryForRoute(saved);
        }
        if (status == RouteStatus.CANCELLED
                && (prevStatus == RouteStatus.DISPATCHED || prevStatus == RouteStatus.IN_PROGRESS)) {
            inventoryService.reverseRouteIssues(
                    saved.getTenantId(), currentUserId(), currentUserName(), saved.getId());
        }

        return toResponse(saved, true);
    }

    @Transactional
    public RouteResponse updateStopStatus(UUID routeId, UUID stopId, RouteStopStatus status,
                                          Double lat, Double lng, String photoUrl, String skipReason) {
        RouteEntity r = findForTenant(routeId);
        RouteStopEntity stop = stopRepository.findByIdAndRouteIdAndIsDeletedFalse(stopId, routeId)
                .orElseThrow(() -> new EntityNotFoundException("Stop not found"));
        stop.setStatus(status);
        if (status == RouteStopStatus.COMPLETED) {
            if (lat != null) stop.setDeliveryLat(lat);
            if (lng != null) stop.setDeliveryLng(lng);
            if (photoUrl != null) stop.setDeliveryPhotoUrl(photoUrl);
            stop.setDeliveredAt(java.time.LocalDateTime.now());
        }
        if (status == RouteStopStatus.SKIPPED && skipReason != null) {
            stop.setSkipReason(skipReason);
        }
        stopRepository.save(stop);
        return toResponse(r, true);
    }

    @Transactional
    public RouteResponse confirmLoad(UUID routeId, LoadConfirmationRequest req) {
        RouteEntity r = findForTenant(routeId);

        if (req.getItems() != null) {
            for (LoadConfirmationRequest.ItemLoad load : req.getItems()) {
                itemRepository.findById(load.getItemId()).ifPresent(item -> {
                    item.setLoadedQty(load.getLoadedQty() != null ? load.getLoadedQty() : item.getQuantity());
                    itemRepository.save(item);
                });
            }
        }

        r.setLoadConfirmedAt(java.time.LocalDateTime.now());
        routeRepository.save(r);
        return toResponse(r, true);
    }

    @Transactional
    public RouteResponse deliverStop(UUID routeId, UUID stopId, DeliverStopRequest req) {
        UUID tenantId = currentTenantId();
        RouteEntity r = findForTenant(routeId);
        RouteStopEntity stop = stopRepository.findByIdAndRouteIdAndIsDeletedFalse(stopId, routeId)
                .orElseThrow(() -> new EntityNotFoundException("Stop not found"));

        stop.setStatus(RouteStopStatus.COMPLETED);
        if (req.getLat() != null) stop.setDeliveryLat(req.getLat());
        if (req.getLng() != null) stop.setDeliveryLng(req.getLng());
        if (req.getPhotoUrl() != null) stop.setDeliveryPhotoUrl(req.getPhotoUrl());
        stop.setDeliveredAt(req.getDeliveredAt() != null ? req.getDeliveredAt() : java.time.LocalDateTime.now());
        if (req.getNotes() != null) stop.setNotes(req.getNotes());
        stopRepository.save(stop);

        if (req.getItems() != null) {
            for (DeliverStopRequest.ItemDelivery delivery : req.getItems()) {
                itemRepository.findByIdAndStopIdAndIsDeletedFalse(delivery.getItemId(), stopId)
                        .ifPresent(item -> {
                            BigDecimal qty = delivery.getActualQty() != null
                                    ? delivery.getActualQty() : item.getQuantity();
                            item.setActualQtyDelivered(qty);
                            itemRepository.save(item);

                            // Trigger refill on OWN tanks linked via active treatment plan
                            if (qty.compareTo(BigDecimal.ZERO) > 0) {
                                planLineRepository.findActiveLineForWellAndProduct(
                                        tenantId, stop.getWellId(), item.getProductId(),
                                        TreatmentPlanStatus.ACTIVE)
                                        .ifPresent(line -> {
                                            if (line.getTankId() != null) {
                                                TankEventRequest event = new TankEventRequest();
                                                event.setEventType(TankEventType.REFILLED);
                                                event.setAmountGallons(qty);
                                                event.setEventAt(Instant.now());
                                                try {
                                                    tankService.logEvent(line.getTankId(), event);
                                                } catch (Exception ignored) {
                                                    // Don't fail delivery if tank refill fails
                                                }
                                            }
                                        });
                            }
                        });
            }
        }

        return toResponse(r, true);
    }

    @Transactional
    public RouteResponse submitPreTrip(UUID routeId, PreTripRequest req) {
        RouteEntity r = findForTenant(routeId);
        r.setPreTripConfirmedAt(java.time.LocalDateTime.now());
        r.setPreTripHasIssues(req.isHasIssues());
        r.setPreTripNotes(req.getNotes());
        routeRepository.save(r);
        return toResponse(r, true);
    }

    @Transactional
    public RouteResponse returnInventory(UUID routeId, ReturnInventoryRequest req) {
        RouteEntity r = findForTenant(routeId);
        if (req.getItems() != null && !req.getItems().isEmpty() && r.getWarehouseId() != null) {
            inventoryService.returnForRoute(
                    r.getTenantId(), currentUserId(), currentUserName(),
                    r.getWarehouseId(), r.getId(), r.getRouteDate(), req.getItems());
        }
        r.setStatus(RouteStatus.COMPLETED);
        routeRepository.save(r);
        return toResponse(r, true);
    }

    private void apply(RouteEntity r, RouteRequest req) {
        r.setDriverId(req.getDriverId());
        r.setVehicleId(req.getVehicleId());
        r.setTruckNumber(req.getVehicleId() != null
                ? vehicleRepository.findById(req.getVehicleId())
                        .map(v -> v.getLicensePlate()).orElse(null)
                : null);
        r.setWarehouseId(req.getWarehouseId());
        r.setRouteDate(req.getRouteDate());
        r.setStatus(req.getStatus() != null ? req.getStatus() : RouteStatus.PLANNED);
        r.setNotes(req.getNotes());
    }

    private void issueInventoryForRoute(RouteEntity r) {
        List<RouteStopEntity> stops = stopRepository
                .findAllByRouteIdAndIsDeletedFalseOrderBySequenceOrderAsc(r.getId());
        List<InventoryService.RouteIssueItem> items = new ArrayList<>();
        for (RouteStopEntity stop : stops) {
            String wellName = wellRepository.findByIdAndTenantIdAndIsDeletedFalse(stop.getWellId(), r.getTenantId())
                    .map(w -> w.getWellName()).orElse("Well");
            for (RouteStopItemEntity item : itemRepository
                    .findAllByStopIdAndIsDeletedFalseOrderByCreatedAtAsc(stop.getId())) {
                items.add(new InventoryService.RouteIssueItem(
                        item.getProductId(), item.getQuantity(), item.getUnit(),
                        stop.getSequenceOrder(), wellName));
            }
        }
        if (!items.isEmpty()) {
            inventoryService.issueForRoute(
                    r.getTenantId(), currentUserId(), currentUserName(),
                    r.getWarehouseId(), r.getId(), r.getRouteDate(), items);
        }
    }

    private RouteResponse toResponse(RouteEntity r, boolean includeStops) {
        String driverName = userRepository.findById(r.getDriverId())
                .map(u -> u.getFullName()).orElse(null);

        String warehouseName = r.getWarehouseId() != null
                ? warehouseRepository.findByIdAndTenantIdAndIsDeletedFalse(r.getWarehouseId(), r.getTenantId())
                        .map(w -> w.getName()).orElse(null)
                : null;

        int stopCount = stopRepository.countByRouteIdAndIsDeletedFalse(r.getId());
        int completedStopCount = stopRepository.countByRouteIdAndStatusAndIsDeletedFalse(r.getId(), RouteStopStatus.COMPLETED);

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

        return RouteResponse.from(r, driverName, warehouseName, stopCount, completedStopCount, stops);
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

    private String currentUserName() {
        return userRepository.findById(currentUserId())
                .map(u -> u.getFullName()).orElse("System");
    }
}
