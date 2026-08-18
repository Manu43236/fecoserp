CREATE TABLE tank_events (
    id               CHAR(36)      NOT NULL PRIMARY KEY,
    tenant_id        CHAR(36)      NOT NULL,
    tank_id          CHAR(36)      NOT NULL,
    event_type       ENUM('INSTALLED','FILLED','RATE_CHANGED','REFILLED','REMOVED') NOT NULL,
    amount_gallons   DECIMAL(10,2) NULL,
    rec_rate         DECIMAL(10,4) NULL,
    level_pct        DECIMAL(5,2)  NULL,
    performed_by_id  CHAR(36)      NULL,
    event_at         TIMESTAMP     NOT NULL,
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
