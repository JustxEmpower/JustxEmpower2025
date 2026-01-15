-- ============================================================
-- JustEmpower Production Database Seed Script
-- Target: AWS RDS MySQL (justxempower database)
-- ============================================================
-- 
-- INSTRUCTIONS:
-- 1. Connect to AWS RDS MySQL:
--    mysql -h justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com -u justxempower -p justxempower
--    Password: JustEmpower2025Secure
--
-- 2. Run this entire script to seed the database
--
-- ============================================================

-- ============================================================
-- SECTION 1: CLEAR EXISTING DATA (OPTIONAL)
-- ============================================================
-- Uncomment the following lines ONLY if you want to start fresh
-- WARNING: This will delete all existing data in these tables!

-- DELETE FROM navigation;
-- DELETE FROM carouselOfferings;
-- DELETE FROM siteContent WHERE page = 'global';

-- ============================================================
-- SECTION 2: HEADER NAVIGATION
-- ============================================================

-- Main header navigation items (no parent)
INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab, parentId) VALUES
('header', 'Philosophy', '/philosophy', 1, 0, 0, NULL),
('header', 'Offerings', '/offerings', 2, 0, 0, NULL),
('header', 'Journal', '/journal', 3, 0, 0, NULL),
('header', 'Shop', '/shop', 4, 0, 0, NULL),
('header', 'Events', '/events', 5, 0, 0, NULL),
('header', 'Contact', '/contact', 6, 0, 0, NULL),
('header', 'Walk With Us', '/walk-with-us', 7, 0, 0, NULL);

-- Get the ID of Philosophy to add dropdown children
SET @philosophyId = (SELECT id FROM navigation WHERE label = 'Philosophy' AND location = 'header' AND parentId IS NULL LIMIT 1);

-- Philosophy dropdown children
INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab, parentId) VALUES
('header', 'Founder', '/philosophy/founder', 1, 0, 0, @philosophyId),
('header', 'Vision & Ethos', '/philosophy/vision-ethos', 2, 0, 0, @philosophyId);

-- Get the ID of Offerings to add dropdown children
SET @offeringsId = (SELECT id FROM navigation WHERE label = 'Offerings' AND location = 'header' AND parentId IS NULL LIMIT 1);

-- Offerings dropdown children
INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab, parentId) VALUES
('header', 'Living Codex', '/offerings/living-codex', 1, 0, 0, @offeringsId),
('header', 'MOM VI•X', '/offerings/mom-vix', 2, 0, 0, @offeringsId),
('header', 'BloomXFlight', '/offerings/bloomxflight', 3, 0, 0, @offeringsId),
('header', 'She Writes', '/offerings/she-writes', 4, 0, 0, @offeringsId),
('header', 'Workshops', '/offerings/workshops', 5, 0, 0, @offeringsId),
('header', 'Rooted Unity', '/offerings/rooted-unity', 6, 0, 0, @offeringsId);

-- ============================================================
-- SECTION 3: FOOTER NAVIGATION
-- ============================================================

INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab, parentId) VALUES
('footer', 'About', '/about', 1, 0, 0, NULL),
('footer', 'Philosophy', '/philosophy', 2, 0, 0, NULL),
('footer', 'Offerings', '/offerings', 3, 0, 0, NULL),
('footer', 'Journal', '/journal', 4, 0, 0, NULL),
('footer', 'Shop', '/shop', 5, 0, 0, NULL),
('footer', 'Events', '/events', 6, 0, 0, NULL),
('footer', 'Contact', '/contact', 7, 0, 0, NULL),
('footer', 'Privacy Policy', '/privacy-policy', 8, 0, 0, NULL),
('footer', 'Terms of Service', '/terms-of-service', 9, 0, 0, NULL);

-- ============================================================
-- SECTION 4: CAROUSEL OFFERINGS
-- ============================================================

INSERT INTO carouselOfferings (title, description, link, imageUrl, `order`, isActive) VALUES
('The Living Codex™', 'A proprietary 160-question archetypal assessment system for deep self-discovery and transformation.', '/offerings/living-codex', '/images/offerings/living-codex.jpg', 1, 1),
('MOM VI•X Journal Trilogy', 'Three-volume healing journey for maternal lineage work and intergenerational transformation.', '/offerings/mom-vix', '/images/offerings/mom-vix.jpg', 2, 1),
('BloomXFlight', 'Pollinator restoration initiative creating butterfly habitats and ecological stewardship.', '/offerings/bloomxflight', '/images/offerings/bloomxflight.jpg', 3, 1),
('She Writes', 'Lessons from the Living Codex - wisdom, insights, and transformational content.', '/offerings/she-writes', '/images/offerings/she-writes.jpg', 4, 1),
('Workshops & Programs', 'Trauma-informed programming serving foster youth, veterans, and survivors.', '/offerings/workshops', '/images/offerings/workshops.jpg', 5, 1),
('Rooted Unity', 'Ecological stewardship meets personal healing - Coming 2026.', '/offerings/rooted-unity', '/images/offerings/rooted-unity.jpg', 6, 1);

-- ============================================================
-- SECTION 5: GLOBAL CONTENT (Footer, Newsletter Popup)
-- ============================================================

-- Footer Content
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('global', 'footer', 'tagline', 'Catalyzing the Rise of Her'),
('global', 'footer', 'column1Title', 'Navigate'),
('global', 'footer', 'column2Title', 'Connect'),
('global', 'footer', 'column3Title', 'Legal'),
('global', 'footer', 'newsletterTitle', 'Stay Connected'),
('global', 'footer', 'newsletterDescription', 'Join our community for updates on offerings, events, and wisdom.'),
('global', 'footer', 'copyright', '© 2025 Just Empower. All rights reserved.'),
('global', 'footer', 'instagramUrl', 'https://instagram.com/justxempower'),
('global', 'footer', 'facebookUrl', 'https://facebook.com/justxempower'),
('global', 'footer', 'youtubeUrl', 'https://youtube.com/@justxempower'),
('global', 'footer', 'linkedinUrl', 'https://linkedin.com/company/justxempower');

-- Newsletter Popup Content
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('global', 'newsletter_popup', 'title', 'Join Our Community'),
('global', 'newsletter_popup', 'description', 'Subscribe to receive updates on new offerings, events, and wisdom from Just Empower.'),
('global', 'newsletter_popup', 'ctaText', 'Subscribe'),
('global', 'newsletter_popup', 'privacyText', 'We respect your privacy. Unsubscribe at any time.');

-- ============================================================
-- SECTION 6: VERIFICATION QUERIES
-- ============================================================

-- Run these queries to verify the data was inserted correctly:

-- SELECT 'Navigation Items' AS 'Table', COUNT(*) AS 'Count' FROM navigation;
-- SELECT 'Carousel Offerings' AS 'Table', COUNT(*) AS 'Count' FROM carouselOfferings;
-- SELECT 'Global Content' AS 'Table', COUNT(*) AS 'Count' FROM siteContent WHERE page = 'global';

-- View navigation items:
-- SELECT id, location, label, url, parentId FROM navigation ORDER BY location, `order`;

-- View carousel offerings:
-- SELECT id, title, isActive, `order` FROM carouselOfferings ORDER BY `order`;

-- View global content:
-- SELECT page, section, contentKey, LEFT(contentValue, 50) AS contentValue FROM siteContent WHERE page = 'global';

-- ============================================================
-- END OF SEED SCRIPT
-- ============================================================
