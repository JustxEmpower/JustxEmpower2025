-- Initialize legal sections for all 4 legal pages
-- Run this with: mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DB < scripts/init-legal-sections.sql

-- Privacy Policy
INSERT INTO siteContent (page, section, contentKey, contentValue) 
SELECT 'privacy-policy', 'legalSections', 'sections', '[]'
WHERE NOT EXISTS (
  SELECT 1 FROM siteContent 
  WHERE page = 'privacy-policy' AND section = 'legalSections'
);

-- Terms of Service
INSERT INTO siteContent (page, section, contentKey, contentValue) 
SELECT 'terms-of-service', 'legalSections', 'sections', '[]'
WHERE NOT EXISTS (
  SELECT 1 FROM siteContent 
  WHERE page = 'terms-of-service' AND section = 'legalSections'
);

-- Accessibility Statement
INSERT INTO siteContent (page, section, contentKey, contentValue) 
SELECT 'accessibility', 'legalSections', 'sections', '[]'
WHERE NOT EXISTS (
  SELECT 1 FROM siteContent 
  WHERE page = 'accessibility' AND section = 'legalSections'
);

-- Cookie Policy
INSERT INTO siteContent (page, section, contentKey, contentValue) 
SELECT 'cookie-policy', 'legalSections', 'sections', '[]'
WHERE NOT EXISTS (
  SELECT 1 FROM siteContent 
  WHERE page = 'cookie-policy' AND section = 'legalSections'
);

SELECT 'Legal sections initialized successfully!' AS status;
