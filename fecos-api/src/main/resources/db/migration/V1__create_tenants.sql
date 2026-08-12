CREATE TABLE IF NOT EXISTS tenants (
    id            CHAR(36)     NOT NULL PRIMARY KEY,
    company_name  VARCHAR(255) NOT NULL,
    subdomain     VARCHAR(100) NOT NULL,
    logo_url      VARCHAR(512),
    favicon_url   VARCHAR(512),
    primary_color VARCHAR(7),
    dark_color    VARCHAR(7),
    accent_color  VARCHAR(7),
    email_from    VARCHAR(255),
    plan          VARCHAR(20)  NOT NULL DEFAULT 'PILOT',
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    created_by    CHAR(36),
    CONSTRAINT uq_tenants_subdomain UNIQUE (subdomain)
);

-- Seed pilot tenant for Endura Products Corp
INSERT IGNORE INTO tenants (id, company_name, subdomain, primary_color, dark_color, accent_color, plan, email_from)
VALUES (
    UUID(),
    'Endura Products Corp',
    'endura',
    '#751903',
    '#3F0C00',
    '#E5D4CF',
    'PILOT',
    'noreply@fecoserp.com'
);
