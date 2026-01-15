-- Remove the legalSections entries from all legal pages
DELETE FROM siteContent 
WHERE section = 'legalSections';

SELECT 'legalSections removed from database.' AS status;
