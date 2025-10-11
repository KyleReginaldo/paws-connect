-- Add QR code and GCash number fields to fundraising table
-- Migration: Add qr_code and gcash_number columns to fundraising table

ALTER TABLE fundraising 
ADD COLUMN IF NOT EXISTS qr_code TEXT,
ADD COLUMN IF NOT EXISTS gcash_number TEXT;

-- Add check constraint for GCash number format (Philippines mobile number format)
ALTER TABLE fundraising 
ADD CONSTRAINT check_gcash_number_format 
CHECK (
  gcash_number IS NULL OR 
  gcash_number ~ '^(09|\+639)\d{9}$'
);

-- Add comments for documentation
COMMENT ON COLUMN fundraising.qr_code IS 'URL or base64 string of QR code image for GCash donations';
COMMENT ON COLUMN fundraising.gcash_number IS 'GCash mobile number for donations (format: 09XXXXXXXXX or +639XXXXXXXXX)';