package com.fecos.products;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 50)
    private String productCode;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Unit is required")
    private String unit;

    private String description;

    private BigDecimal pricePerUnit;

    private boolean isActive = true;
}
