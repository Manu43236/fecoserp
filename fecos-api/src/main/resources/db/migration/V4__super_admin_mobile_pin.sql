-- Give SUPER_ADMIN a mobile number and PIN for mobile+PIN login
-- pin_hash is BCrypt of '1234'
UPDATE users
SET mobile_number = '0000000000',
    pin_hash      = '$2b$10$2bwj3Jfk3tjL3LbgVooRSuvRb59eW5gWqt9WbI8.pMPHvkvR6wcie'
WHERE id = '00000000-0000-0000-0000-000000000001';
