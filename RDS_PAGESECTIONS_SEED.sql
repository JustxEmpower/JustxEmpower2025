-- =====================================================
-- JustEmpower RDS Database - PageSections Schema & Seed
-- Run this on your AWS RDS MySQL database
-- =====================================================

-- Step 1: Create the pageSections table if it doesn't exist
CREATE TABLE IF NOT EXISTS `pageSections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pageId` int(11) NOT NULL,
  `sectionType` enum('header','hero','content','carousel','grid','form','video','quote','cta','calendar','footer','newsletter','community','testimonials','gallery','map','products','articles','team','faq','pricing','features','stats','social','rooted-unity','pillar-grid') NOT NULL,
  `sectionOrder` int(11) NOT NULL DEFAULT '0',
  `title` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `requiredFields` text DEFAULT NULL,
  `isVisible` int(11) NOT NULL DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Clear existing pageSections data (optional - uncomment if you want fresh start)
-- DELETE FROM pageSections;

-- Step 3: Get page IDs (run this query first to verify your page IDs match)
-- SELECT id, slug, title FROM pages ORDER BY id;

-- Step 4: Seed pageSections for Home page (pageId = 1)
-- Note: Adjust pageId values based on your actual pages table
INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
-- Home Page Sections
(1, 'hero', 0, 'Hero Section', '{"title":"Just Empower","subtitle":"Catalyzing The Rise of Her","description":"Where Empowerment Becomes Embodiment — cultivating self-trust, clarity, and conscious leadership.","ctaText":"Discover More","ctaUrl":"/philosophy"}', '["title","backgroundImage"]', 1),
(1, 'content', 1, 'Philosophy Preview', '{"title":"The Philosophy","body":"Just Empower operates at the intersection of personal reclamation and collective influence.","ctaText":"Learn More","ctaUrl":"/philosophy"}', '["title","body"]', 1),
(1, 'carousel', 2, 'Offerings Carousel', '{"title":"Our Offerings","items":[]}', '["items"]', 1),
(1, 'community', 3, 'Community Section', '{"title":"Emerge With Us","description":"We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity."}', '["title"]', 1),
(1, 'content', 4, 'Rooted Unity', '{"title":"Rooted Unity","body":"Ecological stewardship meets personal healing.","ctaText":"Coming 2026"}', '["title","body"]', 1),
(1, 'newsletter', 5, 'Newsletter Section', '{"title":"Stay Connected","ctaText":"Subscribe"}', '["title","ctaText"]', 1),
(1, 'footer', 6, 'Footer', '{"copyright":"© 2025 Just Empower. All rights reserved."}', '["copyright"]', 1);

-- Philosophy Page Sections (adjust pageId based on your pages table)
INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60001, 'hero', 0, 'Philosophy Hero', '{"title":"Our Philosophy","subtitle":"The Foundation of Empowerment"}', '["title","backgroundImage"]', 1),
(60001, 'content', 1, 'Core Philosophy', '{"title":"Core Beliefs","body":"At Just Empower, we believe in the transformative power of conscious leadership."}', '["title","body"]', 1),
(60001, 'pillar-grid', 2, 'Three Pillars', '{"title":"The Three Pillars","items":[{"title":"Self-Trust","description":"Building unshakeable confidence from within"},{"title":"Clarity","description":"Seeing through the noise to what matters"},{"title":"Conscious Leadership","description":"Leading with intention and integrity"}]}', '["title","items"]', 1),
(60001, 'quote', 3, 'Founder Quote', '{"quote":"True empowerment begins when we reclaim our inner authority.","author":"Justice Bartlett","authorTitle":"Founder"}', '["quote"]', 1),
(60001, 'cta', 4, 'Call to Action', '{"title":"Ready to Begin?","ctaText":"Explore Our Offerings","ctaUrl":"/offerings"}', '["title","ctaText","ctaUrl"]', 1);

-- Offerings Page Sections (adjust pageId based on your pages table)
INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60004, 'hero', 0, 'Offerings Hero', '{"title":"Our Offerings","subtitle":"Pathways to Transformation"}', '["title","backgroundImage"]', 1),
(60004, 'grid', 1, 'Offerings Grid', '{"title":"Choose Your Path","items":[]}', '["items"]', 1),
(60004, 'testimonials', 2, 'Testimonials', '{"title":"What Others Say","items":[]}', '["items"]', 1),
(60004, 'cta', 3, 'Book Session CTA', '{"title":"Ready to Transform?","ctaText":"Book a Session","ctaUrl":"/contact"}', '["title","ctaText","ctaUrl"]', 1);

-- Contact Page Sections (adjust pageId based on your pages table)
INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60012, 'hero', 0, 'Contact Hero', '{"title":"Get in Touch","subtitle":"We would love to hear from you"}', '["title","backgroundImage"]', 1),
(60012, 'form', 1, 'Contact Form', '{"title":"Send a Message","fields":["name","email","message"],"submitText":"Send Message"}', '["fields","submitText"]', 1),
(60012, 'map', 2, 'Location Map', '{"title":"Find Us","location":"Austin, Texas"}', '["location"]', 1);

-- Shop Page Sections (adjust pageId based on your pages table)
INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60005, 'hero', 0, 'Shop Hero', '{"title":"The Shop","subtitle":"Curated tools for your journey"}', '["title","backgroundImage"]', 1),
(60005, 'products', 1, 'Products Grid', '{"title":"Featured Products","products":[]}', '["products"]', 1),
(60005, 'cta', 2, 'Shop CTA', '{"title":"Custom Orders","ctaText":"Contact Us","ctaUrl":"/contact"}', '["title","ctaText","ctaUrl"]', 1);

-- Walk With Us Page Sections (adjust pageId based on your pages table)
INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60011, 'hero', 0, 'Walk With Us Hero', '{"title":"Walk With Us","subtitle":"Join our community of conscious leaders"}', '["title","backgroundImage"]', 1),
(60011, 'content', 1, 'Community Description', '{"title":"Our Community","body":"A gathering of women committed to personal growth and collective transformation."}', '["title","body"]', 1),
(60011, 'features', 2, 'Membership Benefits', '{"title":"What You Get","items":[]}', '["title","items"]', 1),
(60011, 'cta', 3, 'Join CTA', '{"title":"Ready to Join?","ctaText":"Apply Now","ctaUrl":"/contact"}', '["title","ctaText","ctaUrl"]', 1);

-- =====================================================
-- Verification Query - Run after seeding
-- =====================================================
-- SELECT pageId, COUNT(*) as sections FROM pageSections GROUP BY pageId ORDER BY pageId;
