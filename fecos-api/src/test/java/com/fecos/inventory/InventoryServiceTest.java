package com.fecos.inventory;

import com.fecos.products.ProductEntity;
import com.fecos.products.ProductRepository;
import com.fecos.users.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock InventoryTransactionRepository txRepository;
    @Mock WarehouseRepository warehouseRepository;
    @Mock ProductRepository productRepository;
    @Mock UserRepository userRepository;

    private InventoryService service() {
        return new InventoryService(txRepository, warehouseRepository, productRepository, userRepository);
    }

    @Test
    @DisplayName("issueForRoute rejects when the warehouse is short on a product")
    void issueForRoute_insufficientStock_rejected() {
        UUID tenant = UUID.randomUUID();
        UUID warehouse = UUID.randomUUID();
        UUID product = UUID.randomUUID();

        // Warehouse has 50; route needs 100.
        when(txRepository.stockSummary(tenant, warehouse))
                .thenReturn(List.<Object[]>of(new Object[]{warehouse, product, "Gallon", new BigDecimal("50")}));
        var p = new ProductEntity();
        p.setName("Biocide");
        when(productRepository.findById(product)).thenReturn(Optional.of(p));

        var items = List.of(new InventoryService.RouteIssueItem(
                product, new BigDecimal("100"), "Gallon", 1, "Well 1"));

        assertThatThrownBy(() -> service().issueForRoute(
                tenant, UUID.randomUUID(), "Tester", warehouse, UUID.randomUUID(), LocalDate.now(), items))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Biocide")
                .hasMessageContaining("50");
    }
}
