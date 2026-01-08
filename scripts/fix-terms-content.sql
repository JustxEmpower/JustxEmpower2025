-- Fix Terms of Service Page Content
-- This script updates the siteContent table to match what TermsOfService.tsx expects

-- First, delete any existing sections for terms-of-service page
DELETE FROM siteContent WHERE page = 'terms-of-service';

-- Insert correct sections that match the component structure

-- Hero section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'hero', 'title', 'Terms of Service'),
('terms-of-service', 'hero', 'lastUpdated', 'January 2026');

-- Agreement section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'agreement', 'heading', 'Agreement to Terms'),
('terms-of-service', 'agreement', 'content', 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.');

-- Use License section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'useLicense', 'heading', 'Use License'),
('terms-of-service', 'useLicense', 'intro', 'Permission is granted to temporarily download one copy of the materials (information or software) on Just Empower''s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:'),
('terms-of-service', 'useLicense', 'item1', 'Modify or copy the materials'),
('terms-of-service', 'useLicense', 'item2', 'Use the materials for any commercial purpose or for any public display'),
('terms-of-service', 'useLicense', 'item3', 'Attempt to decompile or reverse engineer any software contained on the website'),
('terms-of-service', 'useLicense', 'item4', 'Remove any copyright or other proprietary notations from the materials'),
('terms-of-service', 'useLicense', 'item5', 'Transfer the materials to another person or "mirror" the materials on any other server');

-- Disclaimer section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'disclaimer', 'heading', 'Disclaimer'),
('terms-of-service', 'disclaimer', 'content', 'The materials on Just Empower''s website are provided on an ''as is'' basis. Just Empower makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.');

-- Limitations section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'limitations', 'heading', 'Limitations'),
('terms-of-service', 'limitations', 'content', 'In no event shall Just Empower or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Just Empower''s website.');

-- Accuracy section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'accuracy', 'heading', 'Accuracy of Materials'),
('terms-of-service', 'accuracy', 'content', 'The materials appearing on Just Empower''s website could include technical, typographical, or photographic errors. Just Empower does not warrant that any of the materials on its website are accurate, complete, or current. Just Empower may make changes to the materials contained on its website at any time without notice.');

-- Links section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'links', 'heading', 'Links'),
('terms-of-service', 'links', 'content', 'Just Empower has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Just Empower of the site. Use of any such linked website is at the user''s own risk.');

-- Modifications section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'modifications', 'heading', 'Modifications'),
('terms-of-service', 'modifications', 'content', 'Just Empower may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.');

-- Governing Law section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'governingLaw', 'heading', 'Governing Law'),
('terms-of-service', 'governingLaw', 'content', 'These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.');

-- Contact section
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'contact', 'heading', 'Contact Us'),
('terms-of-service', 'contact', 'intro', 'If you have any questions about these Terms of Service, please contact us:'),
('terms-of-service', 'contact', 'companyName', 'Just Empower'),
('terms-of-service', 'contact', 'email', 'legal@justxempower.com'),
('terms-of-service', 'contact', 'location', '');

-- Verify the changes
SELECT page, section, contentKey, LEFT(contentValue, 50) as contentPreview 
FROM siteContent 
WHERE page = 'terms-of-service' 
ORDER BY section, contentKey;
