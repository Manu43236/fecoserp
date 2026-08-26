package com.fecos.routes;

import com.fecos.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','TRUCK_DRIVER')")
    public ResponseEntity<ApiResponse<Page<RouteResponse>>> list(
            @RequestParam(required = false) RouteStatus status,
            @RequestParam(required = false) UUID driverId,
            @RequestParam(required = false) LocalDate routeDate,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Routes retrieved",
                routeService.list(status, driverId, routeDate, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','ACCOUNT_REP','TRUCK_DRIVER')")
    public ResponseEntity<ApiResponse<RouteResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok("Route retrieved", routeService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RouteResponse>> create(@Valid @RequestBody RouteRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Route created", routeService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RouteResponse>> update(
            @PathVariable UUID id, @Valid @RequestBody RouteRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Route updated", routeService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        routeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Route deleted", null));
    }

    @PostMapping("/{id}/stops")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RouteResponse>> addStop(
            @PathVariable UUID id, @Valid @RequestBody RouteStopRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Stop added", routeService.addStop(id, req)));
    }

    @DeleteMapping("/{id}/stops/{stopId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RouteResponse>> removeStop(
            @PathVariable UUID id, @PathVariable UUID stopId) {
        return ResponseEntity.ok(ApiResponse.ok("Stop removed", routeService.removeStop(id, stopId)));
    }

    @PostMapping("/{id}/stops/{stopId}/items")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RouteResponse>> addItem(
            @PathVariable UUID id, @PathVariable UUID stopId, @Valid @RequestBody RouteStopItemRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Item added", routeService.addItem(id, stopId, req)));
    }

    @DeleteMapping("/{id}/stops/{stopId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RouteResponse>> removeItem(
            @PathVariable UUID id, @PathVariable UUID stopId, @PathVariable UUID itemId) {
        return ResponseEntity.ok(ApiResponse.ok("Item removed", routeService.removeItem(id, stopId, itemId)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','TRUCK_DRIVER')")
    public ResponseEntity<ApiResponse<RouteResponse>> updateStatus(
            @PathVariable UUID id, @RequestParam RouteStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated", routeService.updateStatus(id, status)));
    }

    @PatchMapping("/{id}/stops/{stopId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','TRUCK_DRIVER')")
    public ResponseEntity<ApiResponse<RouteResponse>> updateStopStatus(
            @PathVariable UUID id, @PathVariable UUID stopId,
            @RequestParam RouteStopStatus status,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) String photoUrl) {
        return ResponseEntity.ok(ApiResponse.ok("Stop status updated",
                routeService.updateStopStatus(id, stopId, status, lat, lng, photoUrl)));
    }
}
