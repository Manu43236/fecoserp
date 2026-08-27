package com.fecos.routes;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class DeliverStopRequest {
    private Double lat;
    private Double lng;
    private String photoUrl;
    private String notes;
    private List<ItemDelivery> items;

    @Getter
    @Setter
    public static class ItemDelivery {
        private UUID itemId;
        private BigDecimal actualQty;
    }
}
