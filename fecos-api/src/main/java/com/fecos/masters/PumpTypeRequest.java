package com.fecos.masters;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PumpTypeRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;
}
