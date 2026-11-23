package com.fecos.routes;

import com.fecos.inventory.InventoryService;
import com.fecos.inventory.WarehouseRepository;
import com.fecos.leases.LeaseRepository;
import com.fecos.products.ProductRepository;
import com.fecos.programs.TreatmentPlanLineRepository;
import com.fecos.tanks.TankService;
import com.fecos.users.UserEntity;
import com.fecos.users.UserRepository;
import com.fecos.vehicles.VehicleRepository;
import com.fecos.wells.WellRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RouteServiceTest {

    @Mock RouteRepository routeRepository;
    @Mock RouteStopRepository stopRepository;
    @Mock RouteStopItemRepository itemRepository;
    @Mock UserRepository userRepository;
    @Mock VehicleRepository vehicleRepository;
    @Mock WarehouseRepository warehouseRepository;
    @Mock LeaseRepository leaseRepository;
    @Mock WellRepository wellRepository;
    @Mock ProductRepository productRepository;
    @Mock InventoryService inventoryService;
    @Mock TreatmentPlanLineRepository planLineRepository;
    @Mock TankService tankService;

    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID USER   = UUID.randomUUID();
    private static final UUID ROUTE  = UUID.randomUUID();

    private RouteService service() {
        return new RouteService(routeRepository, stopRepository, itemRepository, userRepository,
                vehicleRepository, warehouseRepository, leaseRepository, wellRepository,
                productRepository, inventoryService, planLineRepository, tankService);
    }

    @BeforeEach
    void auth() {
        var ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new UsernamePasswordAuthenticationToken(USER.toString(), null, List.of()));
        SecurityContextHolder.setContext(ctx);
        var me = new UserEntity();
        me.setId(USER);
        me.setTenantId(TENANT);
        lenient().when(userRepository.findById(USER)).thenReturn(Optional.of(me));
    }

    @AfterEach
    void clearAuth() { SecurityContextHolder.clearContext(); }

    private RouteEntity route(UUID warehouseId, UUID driverId, RouteStatus status) {
        var r = new RouteEntity();
        r.setId(ROUTE);
        r.setTenantId(TENANT);
        r.setWarehouseId(warehouseId);
        r.setDriverId(driverId);
        r.setStatus(status);
        return r;
    }

    @Test
    @DisplayName("claim loses the race → 409 naming who holds it")
    void claim_lost_conflicts() {
        UUID other = UUID.randomUUID();
        var holder = new UserEntity();
        holder.setId(other);
        holder.setFullName("Bob");
        when(routeRepository.claim(ROUTE, TENANT, USER)).thenReturn(0);
        when(routeRepository.findByIdAndTenantIdAndIsDeletedFalse(ROUTE, TENANT))
                .thenReturn(Optional.of(route(null, other, RouteStatus.PLANNED)));
        when(userRepository.findById(other)).thenReturn(Optional.of(holder));

        assertThatThrownBy(() -> service().claim(ROUTE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Bob");
    }

    @Test
    @DisplayName("start blocked when the route has no pickup warehouse")
    void start_noWarehouse_rejected() {
        when(routeRepository.findByIdAndTenantIdAndIsDeletedFalse(ROUTE, TENANT))
                .thenReturn(Optional.of(route(null, UUID.randomUUID(), RouteStatus.DISPATCHED)));

        assertThatThrownBy(() -> service().updateStatus(ROUTE, RouteStatus.IN_PROGRESS))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("warehouse");
    }

    @Test
    @DisplayName("start blocked when the driver already has another active route")
    void start_oneActive_rejected() {
        UUID driver = UUID.randomUUID();
        when(routeRepository.findByIdAndTenantIdAndIsDeletedFalse(ROUTE, TENANT))
                .thenReturn(Optional.of(route(UUID.randomUUID(), driver, RouteStatus.DISPATCHED)));
        when(routeRepository.existsByTenantIdAndDriverIdAndStatusAndIsDeletedFalseAndIdNot(
                TENANT, driver, RouteStatus.IN_PROGRESS, ROUTE)).thenReturn(true);

        assertThatThrownBy(() -> service().updateStatus(ROUTE, RouteStatus.IN_PROGRESS))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("current route");
    }
}
