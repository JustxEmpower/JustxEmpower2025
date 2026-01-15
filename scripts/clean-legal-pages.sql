-- Delete all existing sections from legal pages (except legalSections)
-- This gives you a completely clean slate for the new Section Creator

-- Privacy Policy - delete all sections except legalSections
DELETE FROM siteContent 
WHERE page = 'privacy-policy' 
AND section != 'legalSections';

-- Terms of Service - delete all sections except legalSections
DELETE FROM siteContent 
WHERE page = 'terms-of-service' 
AND section != 'legalSections';

-- Accessibility Statement - delete all sections except legalSections
DELETE FROM siteContent 
WHERE page = 'accessibility' 
AND section != 'legalSections';

-- Cookie Policy - delete all sections except legalSections
DELETE FROM siteContent 
WHERE page = 'cookie-policy' 
AND section != 'legalSections';

SELECT 'All old sections deleted! Legal pages are now blank.' AS status;
