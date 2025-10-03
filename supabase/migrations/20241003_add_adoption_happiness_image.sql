-- Add happiness_image field to adoption table to store post-adoption photos
-- This allows adopters to share how happy their adopted pets are

ALTER TABLE adoption ADD COLUMN happiness_image TEXT NULL;

-- Add a comment to describe the field
COMMENT ON COLUMN adoption.happiness_image IS 'URL of the image showing the adopted pet in their new happy home, uploaded by the adopter';