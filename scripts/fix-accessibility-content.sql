-- Fix Accessibility Page Content
-- This script updates the siteContent table to match what AccessibilityStatement.tsx expects

-- First, delete orphan/incorrect sections for accessibility page
DELETE FROM siteContent WHERE page = 'accessibility';

-- Insert correct sections that match the component structure

-- Hero section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'hero', 'title', 'Accessibility Statement'),
('accessibility', 'hero', 'lastUpdated', 'January 2026');

-- Commitment section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'commitment', 'heading', 'Our Commitment'),
('accessibility', 'commitment', 'content', 'Just Empower is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.');

-- Conformance section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'conformance', 'heading', 'Conformance Status'),
('accessibility', 'conformance', 'content', 'The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Just Empower is partially conformant with WCAG 2.1 level AA.');

-- Measures section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'measures', 'heading', 'Measures We Take'),
('accessibility', 'measures', 'intro', 'Just Empower takes the following measures to ensure accessibility:'),
('accessibility', 'measures', 'item1', 'Include accessibility as part of our mission statement'),
('accessibility', 'measures', 'item2', 'Integrate accessibility into our procurement practices'),
('accessibility', 'measures', 'item3', 'Provide continual accessibility training for our staff'),
('accessibility', 'measures', 'item4', 'Include people with disabilities in our design personas'),
('accessibility', 'measures', 'item5', 'Use clear and consistent navigation throughout the website'),
('accessibility', 'measures', 'item6', 'Provide text alternatives for non-text content'),
('accessibility', 'measures', 'item7', 'Ensure sufficient color contrast'),
('accessibility', 'measures', 'item8', 'Make all functionality available from a keyboard');

-- Features section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'features', 'heading', 'Accessibility Features'),
('accessibility', 'features', 'intro', 'Our website includes the following accessibility features:'),
('accessibility', 'features', 'keyboard', 'All interactive elements can be accessed using a keyboard'),
('accessibility', 'features', 'screenReader', 'Our site is compatible with popular screen readers'),
('accessibility', 'features', 'altText', 'Images include descriptive alternative text'),
('accessibility', 'features', 'resizableText', 'Text can be resized without loss of content or functionality'),
('accessibility', 'features', 'colorContrast', 'We maintain sufficient contrast between text and backgrounds'),
('accessibility', 'features', 'focusIndicators', 'Visible focus indicators for keyboard navigation'),
('accessibility', 'features', 'skipLinks', 'Skip navigation links for screen reader users');

-- Limitations section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'limitations', 'heading', 'Known Limitations'),
('accessibility', 'limitations', 'intro', 'Despite our best efforts, some content may not yet be fully accessible. We are actively working to identify and address these issues. Known limitations include:'),
('accessibility', 'limitations', 'item1', 'Some older PDF documents may not be fully accessible'),
('accessibility', 'limitations', 'item2', 'Some video content may not have captions (we are working to add them)'),
('accessibility', 'limitations', 'item3', 'Some third-party content may not meet accessibility standards');

-- Feedback section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'feedback', 'heading', 'Feedback'),
('accessibility', 'feedback', 'intro', 'We welcome your feedback on the accessibility of the Just Empower website. Please let us know if you encounter accessibility barriers:'),
('accessibility', 'feedback', 'email', 'accessibility@justxempower.com'),
('accessibility', 'feedback', 'response', 'We try to respond to accessibility feedback within 5 business days and will work with you to resolve any issues.');

-- Compatibility section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'compatibility', 'heading', 'Compatibility'),
('accessibility', 'compatibility', 'intro', 'Our website is designed to be compatible with the following assistive technologies:'),
('accessibility', 'compatibility', 'item1', 'Screen readers (JAWS, NVDA, VoiceOver)'),
('accessibility', 'compatibility', 'item2', 'Screen magnification software'),
('accessibility', 'compatibility', 'item3', 'Speech recognition software'),
('accessibility', 'compatibility', 'item4', 'Keyboard-only navigation');

-- Contact section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('accessibility', 'contact', 'heading', 'Contact Us'),
('accessibility', 'contact', 'intro', 'If you have any questions about our accessibility efforts, please contact us:'),
('accessibility', 'contact', 'companyName', 'Just Empower'),
('accessibility', 'contact', 'email', 'info@justxempower.com'),
('accessibility', 'contact', 'location', '');

-- Verify the changes
SELECT page, section, contentKey, LEFT(contentValue, 50) as contentPreview 
FROM siteContent 
WHERE page = 'accessibility' 
ORDER BY section, contentKey;
