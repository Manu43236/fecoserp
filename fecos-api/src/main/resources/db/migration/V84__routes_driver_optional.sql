-- Routes can be created without a driver; a driver is required only to dispatch/start.
-- Make routes.driver_id nullable (FK to users stays intact).
-- Idempotent: only alter if the column is still NOT NULL.

DROP PROCEDURE IF EXISTS fecos_v84_driver_optional;
DELIMITER $$
CREATE PROCEDURE fecos_v84_driver_optional()
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = DATABASE() AND table_name = 'routes'
                 AND column_name = 'driver_id' AND is_nullable = 'NO') THEN
        ALTER TABLE routes MODIFY COLUMN driver_id CHAR(36) NULL;
    END IF;
END$$
DELIMITER ;

CALL fecos_v84_driver_optional();
DROP PROCEDURE fecos_v84_driver_optional;
