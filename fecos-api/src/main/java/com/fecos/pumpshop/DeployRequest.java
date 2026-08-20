package com.fecos.pumpshop;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class DeployRequest {

    @NotNull
    private UUID tankId;
}
