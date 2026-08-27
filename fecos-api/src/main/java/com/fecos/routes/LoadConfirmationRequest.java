package com.fecos.routes;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class LoadConfirmationRequest {
    private List<ItemLoad> items;

    @Getter
    @Setter
    public static class ItemLoad {
        private UUID itemId;
        private BigDecimal loadedQty;
    }
}
