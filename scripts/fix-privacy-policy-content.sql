-- Fix Privacy Policy Page Content
-- This script updates the siteContent table to match what PrivacyPolicy.tsx expects

-- First, delete orphan/incorrect sections for privacy-policy page
DELETE FROM siteContent WHERE page = 'privacy-policy';

-- Insert correct sections that match the component structure

-- Hero section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('privacy-policy', 'hero', 'title', 'Privacy Policy'),
('privacy-policy', 'hero', 'lastUpdated', 'January 2026');

-- Introduction section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('privacy-policy', 'introduction', 'heading', 'Introduction'),
('privacy-policy', 'introduction', 'content', 'Just Empower ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.');

-- Information We Collect section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('privacy-policy', 'informationCollect', 'heading', 'Information We Collect'),
('privacy-policy', 'informationCollect', 'subheading', 'Personal Data'),
('privacy-policy', 'informationCollect', 'intro', 'We may collect personally identifiable information, such as:'),
('privacy-policy', 'informationCollect', 'item1', 'Name and email address'),
('privacy-policy', 'informationCollect', 'item2', 'Phone number'),
('privacy-policy', 'informationCollect', 'item3', 'Mailing address'),
('privacy-policy', 'informationCollect', 'item4', 'Payment information'),
('privacy-policy', 'informationCollect', 'item5', 'Any other information you voluntarily provide');

-- How We Use Your Information section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('privacy-policy', 'howWeUse', 'heading', 'How We Use Your Information'),
('privacy-policy', 'howWeUse', 'intro', 'We use the information we collect for purposes including:'),
('privacy-policy', 'howWeUse', 'item1', 'Providing and improving our services'),
('privacy-policy', 'howWeUse', 'item2', 'Processing transactions and sending related information'),
('privacy-policy', 'howWeUse', 'item3', 'Sending promotional communications (with your consent)'),
('privacy-policy', 'howWeUse', 'item4', 'Responding to your inquiries and requests'),
('privacy-policy', 'howWeUse', 'item5', 'Analyzing usage patterns to improve our website'),
('privacy-policy', 'howWeUse', 'item6', 'Complying with legal obligations');

-- Data Security section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('privacy-policy', 'dataSecurity', 'heading', 'Data Security'),
('privacy-policy', 'dataSecurity', 'content', 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure.');

-- Your Rights section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('privacy-policy', 'yourRights', 'heading', 'Your Rights'),
('privacy-policy', 'yourRights', 'intro', 'Depending on your location, you may have certain rights regarding your personal information, including:'),
('privacy-policy', 'yourRights', 'item1', 'The right to access your personal data'),
('privacy-policy', 'yourRights', 'item2', 'The right to correct inaccurate data'),
('privacy-policy', 'yourRights', 'item3', 'The right to request deletion of your data'),
('privacy-policy', 'yourRights', 'item4', 'The right to opt-out of marketing communications');

-- Contact section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('privacy-policy', 'contact', 'heading', 'Contact Us'),
('privacy-policy', 'contact', 'intro', 'If you have questions about this Privacy Policy or our privacy practices, please contact us:'),
('privacy-policy', 'contact', 'companyName', 'Just Empower'),
('privacy-policy', 'contact', 'email', 'privacy@justxempower.com'),
('privacy-policy', 'contact', 'location', '');

-- Verify the changes
SELECT page, section, contentKey, LEFT(contentValue, 50) as contentPreview 
FROM siteContent 
WHERE page = 'privacy-policy' 
ORDER BY section, contentKey;
