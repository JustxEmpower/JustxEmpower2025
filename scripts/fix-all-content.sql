-- =====================================================
-- MASTER CONTENT FIX SCRIPT
-- Run this script to fix all CMS content issues
-- =====================================================

-- This script will:
-- 1. Fix Accessibility page content (remove orphans, add correct sections)
-- 2. Fix Privacy Policy page content (remove test data, add correct sections)
-- 3. Fix Terms of Service page content (add correct sections)
-- 4. Fix Cookie Policy page content (add correct sections)
-- 5. Clean up orphan sections from other pages

-- =====================================================
-- PART 1: FIX ACCESSIBILITY PAGE
-- =====================================================

DELETE FROM siteContent WHERE page = 'accessibility';

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

-- =====================================================
-- PART 2: FIX PRIVACY POLICY PAGE
-- =====================================================

DELETE FROM siteContent WHERE page = 'privacy-policy';

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('privacy-policy', 'hero', 'title', 'Privacy Policy'),
('privacy-policy', 'hero', 'lastUpdated', 'January 2026'),
('privacy-policy', 'introduction', 'heading', 'Introduction'),
('privacy-policy', 'introduction', 'content', 'Just Empower ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.'),
('privacy-policy', 'informationCollect', 'heading', 'Information We Collect'),
('privacy-policy', 'informationCollect', 'subheading', 'Personal Data'),
('privacy-policy', 'informationCollect', 'intro', 'We may collect personally identifiable information, such as:'),
('privacy-policy', 'informationCollect', 'item1', 'Name and email address'),
('privacy-policy', 'informationCollect', 'item2', 'Phone number'),
('privacy-policy', 'informationCollect', 'item3', 'Mailing address'),
('privacy-policy', 'informationCollect', 'item4', 'Payment information'),
('privacy-policy', 'informationCollect', 'item5', 'Any other information you voluntarily provide'),
('privacy-policy', 'howWeUse', 'heading', 'How We Use Your Information'),
('privacy-policy', 'howWeUse', 'intro', 'We use the information we collect for purposes including:'),
('privacy-policy', 'howWeUse', 'item1', 'Providing and improving our services'),
('privacy-policy', 'howWeUse', 'item2', 'Processing transactions and sending related information'),
('privacy-policy', 'howWeUse', 'item3', 'Sending promotional communications (with your consent)'),
('privacy-policy', 'howWeUse', 'item4', 'Responding to your inquiries and requests'),
('privacy-policy', 'howWeUse', 'item5', 'Analyzing usage patterns to improve our website'),
('privacy-policy', 'howWeUse', 'item6', 'Complying with legal obligations'),
('privacy-policy', 'dataSecurity', 'heading', 'Data Security'),
('privacy-policy', 'dataSecurity', 'content', 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is completely secure.'),
('privacy-policy', 'yourRights', 'heading', 'Your Rights'),
('privacy-policy', 'yourRights', 'intro', 'Depending on your location, you may have certain rights regarding your personal information, including:'),
('privacy-policy', 'yourRights', 'item1', 'The right to access your personal data'),
('privacy-policy', 'yourRights', 'item2', 'The right to correct inaccurate data'),
('privacy-policy', 'yourRights', 'item3', 'The right to request deletion of your data'),
('privacy-policy', 'yourRights', 'item4', 'The right to opt-out of marketing communications'),
('privacy-policy', 'contact', 'heading', 'Contact Us'),
('privacy-policy', 'contact', 'intro', 'If you have questions about this Privacy Policy or our privacy practices, please contact us:'),
('privacy-policy', 'contact', 'companyName', 'Just Empower'),
('privacy-policy', 'contact', 'email', 'privacy@justxempower.com'),
('privacy-policy', 'contact', 'location', '');

-- =====================================================
-- PART 3: FIX TERMS OF SERVICE PAGE
-- =====================================================

DELETE FROM siteContent WHERE page = 'terms-of-service';

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('terms-of-service', 'hero', 'title', 'Terms of Service'),
('terms-of-service', 'hero', 'lastUpdated', 'January 2026'),
('terms-of-service', 'agreement', 'heading', 'Agreement to Terms'),
('terms-of-service', 'agreement', 'content', 'By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'),
('terms-of-service', 'useLicense', 'heading', 'Use License'),
('terms-of-service', 'useLicense', 'intro', 'Permission is granted to temporarily download one copy of the materials (information or software) on Just Empower''s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:'),
('terms-of-service', 'useLicense', 'item1', 'Modify or copy the materials'),
('terms-of-service', 'useLicense', 'item2', 'Use the materials for any commercial purpose or for any public display'),
('terms-of-service', 'useLicense', 'item3', 'Attempt to decompile or reverse engineer any software contained on the website'),
('terms-of-service', 'useLicense', 'item4', 'Remove any copyright or other proprietary notations from the materials'),
('terms-of-service', 'useLicense', 'item5', 'Transfer the materials to another person or "mirror" the materials on any other server'),
('terms-of-service', 'disclaimer', 'heading', 'Disclaimer'),
('terms-of-service', 'disclaimer', 'content', 'The materials on Just Empower''s website are provided on an ''as is'' basis. Just Empower makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.'),
('terms-of-service', 'limitations', 'heading', 'Limitations'),
('terms-of-service', 'limitations', 'content', 'In no event shall Just Empower or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Just Empower''s website.'),
('terms-of-service', 'accuracy', 'heading', 'Accuracy of Materials'),
('terms-of-service', 'accuracy', 'content', 'The materials appearing on Just Empower''s website could include technical, typographical, or photographic errors. Just Empower does not warrant that any of the materials on its website are accurate, complete, or current. Just Empower may make changes to the materials contained on its website at any time without notice.'),
('terms-of-service', 'links', 'heading', 'Links'),
('terms-of-service', 'links', 'content', 'Just Empower has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Just Empower of the site. Use of any such linked website is at the user''s own risk.'),
('terms-of-service', 'modifications', 'heading', 'Modifications'),
('terms-of-service', 'modifications', 'content', 'Just Empower may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.'),
('terms-of-service', 'governingLaw', 'heading', 'Governing Law'),
('terms-of-service', 'governingLaw', 'content', 'These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.'),
('terms-of-service', 'contact', 'heading', 'Contact Us'),
('terms-of-service', 'contact', 'intro', 'If you have any questions about these Terms of Service, please contact us:'),
('terms-of-service', 'contact', 'companyName', 'Just Empower'),
('terms-of-service', 'contact', 'email', 'legal@justxempower.com'),
('terms-of-service', 'contact', 'location', '');

-- =====================================================
-- PART 4: FIX COOKIE POLICY PAGE
-- =====================================================

DELETE FROM siteContent WHERE page = 'cookie-policy';

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('cookie-policy', 'hero', 'title', 'Cookie Policy'),
('cookie-policy', 'hero', 'lastUpdated', 'January 2026'),
('cookie-policy', 'whatAreCookies', 'heading', 'What Are Cookies?'),
('cookie-policy', 'whatAreCookies', 'content', 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.'),
('cookie-policy', 'howWeUse', 'heading', 'How We Use Cookies'),
('cookie-policy', 'howWeUse', 'intro', 'Just Empower uses cookies for the following purposes:'),
('cookie-policy', 'howWeUse', 'essential', 'Required for the website to function properly'),
('cookie-policy', 'howWeUse', 'performance', 'Help us understand how visitors use our website'),
('cookie-policy', 'howWeUse', 'functional', 'Remember your preferences and settings'),
('cookie-policy', 'howWeUse', 'marketing', 'Track your activity for targeted advertising (with consent)'),
('cookie-policy', 'thirdParty', 'heading', 'Third-Party Cookies'),
('cookie-policy', 'thirdParty', 'content', 'We may allow third-party service providers to place cookies on your device for analytics, advertising, and other purposes. These third parties have their own privacy policies governing their use of cookies.'),
('cookie-policy', 'managing', 'heading', 'Managing Cookies'),
('cookie-policy', 'managing', 'content', 'You can control and manage cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of our website.'),
('cookie-policy', 'yourChoices', 'heading', 'Your Choices'),
('cookie-policy', 'yourChoices', 'content', 'By using our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by changing your browser settings or contacting us.'),
('cookie-policy', 'contact', 'heading', 'Contact Us'),
('cookie-policy', 'contact', 'intro', 'If you have questions about our cookie practices, please contact us:'),
('cookie-policy', 'contact', 'companyName', 'Just Empower'),
('cookie-policy', 'contact', 'email', 'privacy@justxempower.com'),
('cookie-policy', 'contact', 'location', '');

-- =====================================================
-- PART 5: CLEAN UP ORPHAN SECTIONS FROM OTHER PAGES
-- =====================================================

-- Remove orphan "main" and "The Three Pillars" sections from philosophy page
-- (These sections exist in CMS but are not rendered on the live site)
DELETE FROM siteContent WHERE page = 'philosophy' AND section IN ('main', 'The Three Pillars');

-- Remove orphan "Rooted Unity Section" from home page if it exists
DELETE FROM siteContent WHERE page = 'home' AND section = 'Rooted Unity Section';

-- Remove duplicate "Our Offerings" sections from home page (keep only one)
-- First, check for duplicates and keep the one with more content

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

SELECT '=== ACCESSIBILITY PAGE ===' as info;
SELECT page, section, contentKey, LEFT(contentValue, 40) as preview FROM siteContent WHERE page = 'accessibility' ORDER BY section, contentKey;

SELECT '=== PRIVACY POLICY PAGE ===' as info;
SELECT page, section, contentKey, LEFT(contentValue, 40) as preview FROM siteContent WHERE page = 'privacy-policy' ORDER BY section, contentKey;

SELECT '=== TERMS OF SERVICE PAGE ===' as info;
SELECT page, section, contentKey, LEFT(contentValue, 40) as preview FROM siteContent WHERE page = 'terms-of-service' ORDER BY section, contentKey;

SELECT '=== COOKIE POLICY PAGE ===' as info;
SELECT page, section, contentKey, LEFT(contentValue, 40) as preview FROM siteContent WHERE page = 'cookie-policy' ORDER BY section, contentKey;

SELECT '=== CONTENT COUNT BY PAGE ===' as info;
SELECT page, COUNT(*) as total_entries FROM siteContent GROUP BY page ORDER BY page;
