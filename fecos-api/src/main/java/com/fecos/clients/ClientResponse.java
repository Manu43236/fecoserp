package com.fecos.clients;

import java.time.Instant;

public record ClientResponse(
        String id,
        String refNumber,
        String companyName,
        String contactName,
        String contactPhone,
        String contactEmail,
        String billingAddress,
        String accountRepId,
        String accountRepName,
        String yardId,
        String yardName,
        boolean isActive,
        Instant createdAt
) {
    public static ClientResponse from(ClientEntity c, String accountRepName) {
        return from(c, accountRepName, null);
    }

    public static ClientResponse from(ClientEntity c, String accountRepName, String yardName) {
        return new ClientResponse(
                c.getId().toString(),
                c.getRefNumber(),
                c.getCompanyName(),
                c.getContactName(),
                c.getContactPhone(),
                c.getContactEmail(),
                c.getBillingAddress(),
                c.getAccountRepId() != null ? c.getAccountRepId().toString() : null,
                accountRepName,
                c.getYardId() != null ? c.getYardId().toString() : null,
                yardName,
                c.isActive(),
                c.getCreatedAt()
        );
    }
}
