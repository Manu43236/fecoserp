package com.fecos.routes;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ReturnInventoryRequest {
    private List<ReturnItem> items;

    @Getter
    @Setter
    public static class ReturnItem {
        private UUID productId;
        private BigDecimal qty;
        private String unit;
    }
}
