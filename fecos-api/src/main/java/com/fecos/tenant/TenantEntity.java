package com.fecos.tenant;

import com.fecos.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "tenants")
public class TenantEntity extends BaseEntity {

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "subdomain", nullable = false, unique = true)
    private String subdomain;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "primary_color", length = 7)
    private String primaryColor;

    @Column(name = "dark_color", length = 7)
    private String darkColor;

    @Column(name = "accent_color", length = 7)
    private String accentColor;

    @Column(name = "email_from")
    private String emailFrom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantPlan plan = TenantPlan.PILOT;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
