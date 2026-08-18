-- Step 1: expand enum to allow both old and new values
ALTER TABLE tanks MODIFY COLUMN status ENUM('INSTALLED','ACTIVE','REMOVED','AVAILABLE','ASSIGNED','CLEANING') NOT NULL DEFAULT 'INSTALLED';

-- Step 2: migrate existing data
UPDATE tanks SET status = 'AVAILABLE' WHERE is_deleted = 0;

-- Step 3: narrow to new values only
ALTER TABLE tanks MODIFY COLUMN status ENUM('AVAILABLE','ASSIGNED','INSTALLED','CLEANING') NOT NULL DEFAULT 'AVAILABLE';
