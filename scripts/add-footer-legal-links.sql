-- Add missing legal links to footer navigation
-- Accessibility Statement and Cookie Policy are missing

-- First, check what legal links already exist
SELECT * FROM navigation WHERE location = 'footer' AND (url LIKE '%privacy%' OR url LIKE '%terms%' OR url LIKE '%cookie%' OR url LIKE '%accessibility%');

-- Add Accessibility Statement if it doesn't exist
INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab)
SELECT 'footer', 'Accessibility', '/accessibility', 100, 0, 0
WHERE NOT EXISTS (
    SELECT 1 FROM navigation WHERE location = 'footer' AND url LIKE '%accessibility%'
);

-- Add Cookie Policy if it doesn't exist
INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab)
SELECT 'footer', 'Cookie Policy', '/cookie-policy', 103, 0, 0
WHERE NOT EXISTS (
    SELECT 1 FROM navigation WHERE location = 'footer' AND url LIKE '%cookie%'
);

-- Verify the links were added
SELECT 'Footer legal links after update:' as status;
SELECT id, label, url, `order` FROM navigation WHERE location = 'footer' AND (url LIKE '%privacy%' OR url LIKE '%terms%' OR url LIKE '%cookie%' OR url LIKE '%accessibility%') ORDER BY `order`;
