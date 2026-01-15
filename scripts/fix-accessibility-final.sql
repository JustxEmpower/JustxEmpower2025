-- FINAL FIX FOR ACCESSIBILITY PAGE
-- This script ensures ALL old data is removed and correct data is inserted

-- Step 1: Show what currently exists
SELECT 'BEFORE CLEANUP - Current accessibility entries:' as status;
SELECT id, page, section, contentKey, LEFT(contentValue, 50) as preview 
FROM siteContent 
WHERE page = 'accessibility' 
ORDER BY id;

-- Step 2: Delete ALL entries for accessibility page (using LIKE to catch any variations)
DELETE FROM siteContent WHERE page = 'accessibility';
DELETE FROM siteContent WHERE page LIKE '%accessibility%';

-- Step 3: Verify deletion
SELECT 'AFTER DELETE - Should be empty:' as status;
SELECT COUNT(*) as remaining FROM siteContent WHERE page = 'accessibility';

-- Step 4: Insert fresh correct data
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'hero', 'title', 'Accessibility Statement'),
('accessibility', 'hero', 'lastUpdated', 'January 2026'),
('accessibility', 'commitment', 'heading', 'Our Commitment'),
('accessibility', 'commitment', 'content', 'Just Empower is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.'),
('accessibility', 'conformance', 'heading', 'Conformance Status'),
('accessibility', 'conformance', 'content', 'The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Just Empower is partially conformant with WCAG 2.1 level AA.'),
('accessibility', 'measures', 'heading', 'Measures We Take'),
('accessibility', 'measures', 'intro', 'Just Empower takes the following measures to ensure accessibility:'),
('accessibility', 'measures', 'item1', 'Include accessibility as part of our mission statement'),
('accessibility', 'measures', 'item2', 'Integrate accessibility into our procurement practices'),
('accessibility', 'measures', 'item3', 'Provide continual accessibility training for our staff'),
('accessibility', 'measures', 'item4', 'Include people with disabilities in our design personas'),
('accessibility', 'measures', 'item5', 'Use clear and consistent navigation throughout the website'),
('accessibility', 'measures', 'item6', 'Provide text alternatives for non-text content'),
('accessibility', 'measures', 'item7', 'Ensure sufficient color contrast'),
('accessibility', 'measures', 'item8', 'Make all functionality available from a keyboard'),
('accessibility', 'features', 'heading', 'Accessibility Features'),
('accessibility', 'features', 'intro', 'Our website includes the following accessibility features:'),
('accessibility', 'features', 'keyboard', 'All interactive elements can be accessed using a keyboard'),
('accessibility', 'features', 'screenReader', 'Our site is compatible with popular screen readers'),
('accessibility', 'features', 'altText', 'Images include descriptive alternative text'),
('accessibility', 'features', 'resizableText', 'Text can be resized without loss of content or functionality'),
('accessibility', 'features', 'colorContrast', 'We maintain sufficient contrast between text and backgrounds'),
('accessibility', 'features', 'focusIndicators', 'Visible focus indicators for keyboard navigation'),
('accessibility', 'features', 'skipLinks', 'Skip navigation links for screen reader users'),
('accessibility', 'limitations', 'heading', 'Known Limitations'),
('accessibility', 'limitations', 'intro', 'Despite our best efforts, some content may not yet be fully accessible. We are actively working to identify and address these issues. Known limitations include:'),
('accessibility', 'limitations', 'item1', 'Some older PDF documents may not be fully accessible'),
('accessibility', 'limitations', 'item2', 'Some video content may not have captions (we are working to add them)'),
('accessibility', 'limitations', 'item3', 'Some third-party content may not meet accessibility standards'),
('accessibility', 'feedback', 'heading', 'Feedback'),
('accessibility', 'feedback', 'intro', 'We welcome your feedback on the accessibility of the Just Empower website. Please let us know if you encounter accessibility barriers:'),
('accessibility', 'feedback', 'email', 'accessibility@justxempower.com'),
('accessibility', 'feedback', 'response', 'We try to respond to accessibility feedback within 5 business days and will work with you to resolve any issues.'),
('accessibility', 'compatibility', 'heading', 'Compatibility'),
('accessibility', 'compatibility', 'intro', 'Our website is designed to be compatible with the following assistive technologies:'),
('accessibility', 'compatibility', 'item1', 'Screen readers (JAWS, NVDA, VoiceOver)'),
('accessibility', 'compatibility', 'item2', 'Screen magnification software'),
('accessibility', 'compatibility', 'item3', 'Speech recognition software'),
('accessibility', 'compatibility', 'item4', 'Keyboard-only navigation'),
('accessibility', 'contact', 'heading', 'Contact Us'),
('accessibility', 'contact', 'intro', 'If you have any questions about our accessibility efforts, please contact us:'),
('accessibility', 'contact', 'companyName', 'Just Empower'),
('accessibility', 'contact', 'email', 'info@justxempower.com'),
('accessibility', 'contact', 'location', '');

-- Step 5: Verify new data
SELECT 'AFTER INSERT - New accessibility entries:' as status;
SELECT id, page, section, contentKey, LEFT(contentValue, 50) as preview 
FROM siteContent 
WHERE page = 'accessibility' 
ORDER BY section, contentKey;

SELECT 'TOTAL COUNT:' as status;
SELECT COUNT(*) as total FROM siteContent WHERE page = 'accessibility';
