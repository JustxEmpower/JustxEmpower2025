-- Fix Cookie Policy Page Content
-- This script updates the siteContent table to match what CookiePolicy.tsx expects

-- First, delete any existing sections for cookie-policy page
DELETE FROM siteContent WHERE page = 'cookie-policy';

-- Insert correct sections that match the component structure

-- Hero section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('cookie-policy', 'hero', 'title', 'Cookie Policy'),
('cookie-policy', 'hero', 'lastUpdated', 'January 2026');

-- What Are Cookies section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('cookie-policy', 'whatAreCookies', 'heading', 'What Are Cookies?'),
('cookie-policy', 'whatAreCookies', 'content', 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.');

-- How We Use Cookies section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('cookie-policy', 'howWeUse', 'heading', 'How We Use Cookies'),
('cookie-policy', 'howWeUse', 'intro', 'Just Empower uses cookies for the following purposes:'),
('cookie-policy', 'howWeUse', 'essential', 'Required for the website to function properly'),
('cookie-policy', 'howWeUse', 'performance', 'Help us understand how visitors use our website'),
('cookie-policy', 'howWeUse', 'functional', 'Remember your preferences and settings'),
('cookie-policy', 'howWeUse', 'marketing', 'Track your activity for targeted advertising (with consent)');

-- Third-Party Cookies section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('cookie-policy', 'thirdParty', 'heading', 'Third-Party Cookies'),
('cookie-policy', 'thirdParty', 'content', 'We may allow third-party service providers to place cookies on your device for analytics, advertising, and other purposes. These third parties have their own privacy policies governing their use of cookies.');

-- Managing Cookies section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('cookie-policy', 'managing', 'heading', 'Managing Cookies'),
('cookie-policy', 'managing', 'content', 'You can control and manage cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of our website.');

-- Your Choices section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('cookie-policy', 'yourChoices', 'heading', 'Your Choices'),
('cookie-policy', 'yourChoices', 'content', 'By using our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by changing your browser settings or contacting us.');

-- Contact section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('cookie-policy', 'contact', 'heading', 'Contact Us'),
('cookie-policy', 'contact', 'intro', 'If you have questions about our cookie practices, please contact us:'),
('cookie-policy', 'contact', 'companyName', 'Just Empower'),
('cookie-policy', 'contact', 'email', 'privacy@justxempower.com'),
('cookie-policy', 'contact', 'location', '');

-- Verify the changes
SELECT page, section, contentKey, LEFT(contentValue, 50) as contentPreview 
FROM siteContent 
WHERE page = 'cookie-policy' 
ORDER BY section, contentKey;
