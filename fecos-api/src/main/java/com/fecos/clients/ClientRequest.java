package com.fecos.clients;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ClientRequest {

    @NotBlank
    @Size(max = 100)
    private String companyName;

    @Size(max = 100)
    private String contactName;

    @Size(max = 20)
    private String contactPhone;

    @Size(max = 100)
    private String contactEmail;

    private String billingAddress;

    private UUID accountRepId;

    private boolean isActive = true;
}
