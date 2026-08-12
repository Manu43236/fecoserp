package com.fecos.tenant;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class TenantResponse {
    private UUID id;
    private String companyName;
    private String subdomain;
    private String ownerName;
    private String contactPhone;
    private String contactEmail;
    private String primaryColor;
    private String darkColor;
    private String accentColor;
    private String logoUrl;
    private String plan;
    private boolean isActive;
    private Instant createdAt;

    public static TenantResponse from(TenantEntity t) {
        return TenantResponse.builder()
                .id(t.getId())
                .companyName(t.getCompanyName())
                .subdomain(t.getSubdomain())
                .ownerName(t.getOwnerName())
                .contactPhone(t.getContactPhone())
                .contactEmail(t.getContactEmail())
                .primaryColor(t.getPrimaryColor())
                .darkColor(t.getDarkColor())
                .accentColor(t.getAccentColor())
                .logoUrl(t.getLogoUrl())
                .plan(t.getPlan().name())
                .isActive(t.isActive())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
