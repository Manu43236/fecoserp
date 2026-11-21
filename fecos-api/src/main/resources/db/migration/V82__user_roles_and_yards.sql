-- Multi-role users + user<->yard assignment.
-- Roles move from the single users.role column into a user_roles join table.
-- Users are assigned to one or more yards via user_yards.

CREATE TABLE IF NOT EXISTS user_roles (
    user_id CHAR(36)    NOT NULL,
    role    VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_yards (
    user_id CHAR(36) NOT NULL,
    yard_id CHAR(36) NOT NULL,
    PRIMARY KEY (user_id, yard_id),
    CONSTRAINT fk_user_yards_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_yards_yard FOREIGN KEY (yard_id) REFERENCES yards(id)
);

-- Backfill each user's existing single role into the join table.
INSERT INTO user_roles (user_id, role)
SELECT id, role FROM users WHERE role IS NOT NULL;

-- Legacy column retained (nullable) for rollback safety; no longer the source of truth.
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NULL;

-- Existing field/field-facing users need a yard: attach to their tenant's Main Yard.
INSERT INTO user_yards (user_id, yard_id)
SELECT u.id, y.id
FROM users u
JOIN yards y ON y.tenant_id = u.tenant_id AND y.name = 'Main Yard' AND y.is_deleted = 0
WHERE u.is_deleted = 0
  AND u.id IN (SELECT user_id FROM user_roles WHERE role IN ('SERVICE_TECH', 'TRUCK_DRIVER', 'ACCOUNT_REP'));
