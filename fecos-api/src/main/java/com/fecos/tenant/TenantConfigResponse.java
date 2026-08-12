package com.fecos.tenant;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TenantConfigResponse {
    private String companyName;
    private String logoUrl;
    private String faviconUrl;
    private String primaryColor;
    private String darkColor;
    private String accentColor;
    private String plan;
}
