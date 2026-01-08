-- Seed Events page content for CMS
-- Run this on the production database to add Events page hero content

-- Insert events page hero content
INSERT INTO siteContent (page, section, contentKey, contentValue, createdAt, updatedAt)
VALUES 
  ('events', 'hero', 'title', 'Events', NOW(), NOW()),
  ('events', 'hero', 'subtitle', 'GATHERINGS & EXPERIENCES', NOW(), NOW()),
  ('events', 'hero', 'description', 'Join us for transformative experiences designed to empower and inspire your journey.', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  contentValue = VALUES(contentValue),
  updatedAt = NOW();

-- Verify the insert
SELECT page, section, contentKey, contentValue FROM siteContent WHERE page = 'events';
