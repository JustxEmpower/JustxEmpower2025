-- CLEANUP ACCESSIBILITY DUPLICATES
-- Delete the old test data entries (IDs 1262-1304) and keep the correct ones (IDs 1219-1261)

-- Show current state
SELECT 'BEFORE CLEANUP:' as status;
SELECT id, section, contentKey, LEFT(contentValue, 40) as preview 
FROM siteContent 
WHERE page = 'accessibility' 
ORDER BY id;

-- Delete the duplicate/old entries (IDs 1262 and above for accessibility)
DELETE FROM siteContent 
WHERE page = 'accessibility' 
AND id >= 1262;

-- Verify cleanup
SELECT 'AFTER CLEANUP:' as status;
SELECT id, section, contentKey, LEFT(contentValue, 40) as preview 
FROM siteContent 
WHERE page = 'accessibility' 
ORDER BY section, contentKey;

SELECT 'TOTAL COUNT:' as status;
SELECT COUNT(*) as total FROM siteContent WHERE page = 'accessibility';
