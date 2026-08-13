package com.fecos.clients;

import java.time.Instant;

public record ClientResponse(
        String id,
        String companyName,
        String contactName,
        String contactPhone,
        String contactEmail,
        String billingAddress,
        String accountRepId,
        String accountRepName,
        boolean isActive,
        Instant createdAt
) {
    public static ClientResponse from(ClientEntity c, String accountRepName) {
        return new ClientResponse(
                c.getId().toString(),
                c.getCompanyName(),
                c.getContactName(),
                c.getContactPhone(),
                c.getContactEmail(),
                c.getBillingAddress(),
                c.getAccountRepId() != null ? c.getAccountRepId().toString() : null,
                accountRepName,
                c.isActive(),
                c.getCreatedAt()
        );
    }
}
