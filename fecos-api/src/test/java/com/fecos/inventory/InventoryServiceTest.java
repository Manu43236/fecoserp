package com.fecos.inventory;

import com.fecos.common.RefNumberService;
import com.fecos.products.ProductRepository;
import com.fecos.users.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock InventoryTransactionRepository txRepository;
    @Mock WarehouseRepository warehouseRepository;
    @Mock ProductRepository productRepository;
    @Mock UserRepository userRepository;
    @Mock RefNumberService refNumberService;

    private InventoryService service() {
        return new InventoryService(txRepository, warehouseRepository, productRepository, userRepository, refNumberService);
    }

    @Test
    @DisplayName("issueForRoute caps the issue at available stock — never negative, never blocks")
    void issueForRoute_insufficientStock_capsAtAvailable() {
        UUID tenant = UUID.randomUUID();
        UUID warehouse = UUID.randomUUID();
        UUID product = UUID.randomUUID();

        // Warehouse has 50; route wants 100 → should issue only 50.
        when(txRepository.stockSummary(tenant, warehouse))
                .thenReturn(List.<Object[]>of(new Object[]{warehouse, product, "Gallon", new BigDecimal("50")}));

        var items = List.of(new InventoryService.RouteIssueItem(
                product, new BigDecimal("100"), "Gallon", 1, "Well 1"));

        service().issueForRoute(
                tenant, UUID.randomUUID(), "Tester", warehouse, UUID.randomUUID(), LocalDate.now(), items);

        var captor = ArgumentCaptor.forClass(InventoryTransactionEntity.class);
        verify(txRepository).save(captor.capture());
        // Issue is stored as a negative quantity, capped at the available 50.
        assertThat(captor.getValue().getQuantity()).isEqualByComparingTo(new BigDecimal("-50"));
    }
}
