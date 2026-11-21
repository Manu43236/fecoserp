-- Third-party ownership for tanks and pumps.
-- A 3rd-party asset belongs to a client (client_id) or, if not a client, a free-text name (third_party_name).
-- Pumps already have an `owner` column; tanks did not.

ALTER TABLE tanks
    ADD COLUMN owner            VARCHAR(20)  NOT NULL DEFAULT 'OWN',
    ADD COLUMN client_id        CHAR(36)     NULL,
    ADD COLUMN third_party_name VARCHAR(150) NULL;

ALTER TABLE pumps
    ADD COLUMN client_id        CHAR(36)     NULL,
    ADD COLUMN third_party_name VARCHAR(150) NULL;
