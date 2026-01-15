-- =====================================================
-- JustEmpower COMPLETE RDS Database Seed
-- Generated: January 4, 2026
-- Purpose: Complete schema and seed data for production RDS
-- =====================================================

-- =====================================================
-- PART 1: CREATE PAGESECTIONS TABLE
-- =====================================================

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
  PRIMARY KEY (`id`),
  KEY `idx_pageId` (`pageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PART 2: CLEAR EXISTING PAGESECTIONS (OPTIONAL)
-- Uncomment if you want a fresh start
-- =====================================================
-- DELETE FROM pageSections;

-- =====================================================
-- PART 3: SEED PAGESECTIONS FOR ALL PAGES
-- Based on CONTENT_AUDIT.md structure
-- =====================================================

-- =====================================================
-- HOME PAGE (pageId = 1, slug = 'home')
-- Sections: Header, Hero, Philosophy Intro, Offerings Carousel, Community, Rooted Unity, Footer
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(1, 'header', 0, 'Header/Navigation', '{"logoUrl":"/logo.svg","navItems":[{"label":"Philosophy","url":"/philosophy"},{"label":"Offerings","url":"/offerings"},{"label":"Shop","url":"/shop"},{"label":"Community Events","url":"/community-events"},{"label":"Resources","url":"/resources"},{"label":"Contact","url":"/contact"},{"label":"Walk With Us","url":"/walk-with-us"}]}', '["logoUrl"]', 1),
(1, 'hero', 1, 'Hero Section', '{"eyebrow":"WELCOME TO JUST EMPOWER","title":"Catalyzing the Rise of Her.","subtitle":"Where empowerment becomes embodied. For women cultivating clarity, leadership, and conscious self-direction.","ctaText":"DISCOVER MORE","ctaUrl":"/philosophy","backgroundType":"video","backgroundUrl":""}', '["title","backgroundImage"]', 1),
(1, 'content', 2, 'Philosophy Intro', '{"eyebrow":"OUR APPROACH","title":"The Philosophy","body":"Just Empower operates at the intersection of personal reclamation and collective responsibility. We believe meaningful leadership begins within—through self-trust, discernment, and embodied integrity—and extends outward into the ways we build, steward, and lead.","ctaText":"LEARN MORE","ctaUrl":"/philosophy","imageUrl":"","imagePosition":"left"}', '["title","body"]', 1),
(1, 'carousel', 3, 'Offerings Carousel', '{"title":"Our Offerings","scrollText":"SCROLL TO EXPLORE","items":[{"title":"Seeds of a New Paradigm","description":"The foundational body of work: embodied leadership and conscious self-authority.","imageUrl":"","ctaText":"EXPLORE","ctaUrl":"/offerings"},{"title":"MOM VI·X Trilogy","description":"A literary exploration of identity, inheritance, and becoming.","imageUrl":"","ctaText":"EXPLORE","ctaUrl":"/vi-x-journal-trilogy"},{"title":"She Writes","description":"Written reflections on embodiment, discernment, and truth.","imageUrl":"","ctaText":"EXPLORE","ctaUrl":"/blog"},{"title":"Rooted Unity","description":"Framework for ecological stewardship and collective responsibility. Launching Fall 2026.","imageUrl":"","ctaText":"EXPLORE","ctaUrl":"/rooted-unity"},{"title":"Walk With Us","description":"Ways to connect, gather, and engage.","imageUrl":"","ctaText":"EXPLORE","ctaUrl":"/walk-with-us"}]}', '["items"]', 1),
(1, 'community', 4, 'Community Section', '{"eyebrow":"COMMUNITY","title":"The Work, In Practice","body":"Just Empower produces written works, frameworks, and curated experiences that support clarity, discernment, and embodied leadership. The work takes form through publishing, reflective writing, and evolving initiatives—each translating inner authority into practical application. This is not motivational content. It is a body of work built on inquiry, integration, and responsibility. It unfolds over time.","ctaText":"WALK WITH US","ctaUrl":"/walk-with-us","mediaUrl":""}', '["title"]', 1),
(1, 'rooted-unity', 5, 'Rooted Unity Preview', '{"eyebrow":"COMING 2026","title":"Rooted Unity","body":"Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self.","ctaText":"LEARN MORE","ctaUrl":"/rooted-unity","imageUrl":""}', '["title","body"]', 1),
(1, 'footer', 6, 'Footer', '{"logoUrl":"/logo-white.svg","tagline":"Catalyzing the Rise of Her","socialLinks":[{"platform":"instagram","url":"https://instagram.com/justxempower"},{"platform":"linkedin","url":"https://linkedin.com/company/justxempower"}],"exploreLinks":[{"label":"About","url":"/about"},{"label":"Philosophy","url":"/philosophy"},{"label":"Offerings","url":"/offerings"},{"label":"Journal","url":"/blog"}],"connectLinks":[{"label":"Contact","url":"/contact"},{"label":"Walk With Us","url":"/walk-with-us"}],"copyright":"© 2026 JUST EMPOWER™. ALL RIGHTS RESERVED.","legalLinks":[{"label":"Accessibility","url":"/accessibility"},{"label":"Privacy Policy","url":"/privacy"},{"label":"Terms of Service","url":"/terms"},{"label":"Cookie Policy","url":"/cookies"}]}', '["copyright"]', 1),
(1, 'newsletter', 7, 'Newsletter Modal', '{"title":"Stay Connected","body":"Join our monthly mailing list for insights on embodied transformation, conscious leadership, and the rise of her.","ctaText":"Subscribe to Newsletter","privacyText":"We respect your privacy. Unsubscribe anytime."}', '["title","ctaText"]', 1);

-- =====================================================
-- PHILOSOPHY PAGE (pageId = 60001, slug = 'philosophy')
-- Sections: Hero, Foundational Principles, Newsletter
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60001, 'hero', 0, 'Philosophy Hero', '{"title":"Our Philosophy","subtitle":"TRUE TRANSFORMATION IS NOT A CONCEPT—IT IS A LIVED EXPERIENCE.","backgroundUrl":""}', '["title","backgroundImage"]', 1),
(60001, 'content', 1, 'Foundational Principles', '{"title":"Foundational Principles","principles":[{"number":"01","title":"EMBODIMENT","description":"Truth begins where intellect ends—within the lived intelligence of the body and breath. Transformation moves from concept into experience, as the nervous system becomes the gateway to sovereignty."},{"number":"02","title":"WHOLENESS","description":"Wholeness is not something to achieve or restore—it is something to reclaim. The work is not about fixing what is broken, but remembering what endures: clarity, sovereignty, embodied truth."},{"number":"03","title":"NATURE''S INTELLIGENCE","description":"Rather than replicating outdated systems, Just Empower roots its work in nature''s original intelligence—adaptive, regenerative, and quietly revolutionary."}],"mediaUrl":""}', '["title","body"]', 1),
(60001, 'newsletter', 2, 'Newsletter Signup', '{"title":"Continue the Conversation","body":"Receive occasional reflections on embodiment, conscious leadership, and the lived philosophy behind Just Empower. Thoughtful insights, shared with intention—never noise.","ctaText":"Subscribe"}', '["title","ctaText"]', 1);

-- =====================================================
-- FOUNDER PAGE (pageId = 60002, slug = 'founder')
-- Sections: Hero, Founder Story Part 1, Just Empower Truth, The Depth Beneath, Newsletter
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60002, 'hero', 0, 'Founder Hero', '{"title":"The Founder","subtitle":"JUSTICE BARTLETT","backgroundUrl":""}', '["title","backgroundImage"]', 1),
(60002, 'content', 1, 'Founder Story Part 1', '{"title":"The Story","body":"Justice Bartlett is the founder of Just Empower, a platform dedicated to embodied leadership and conscious self-authority for women.","imageUrl":"","imagePosition":"right"}', '["title","body"]', 1),
(60002, 'content', 2, 'Just Empower Truth', '{"title":"The Truth Behind Just Empower","body":"Just Empower was born from a deep commitment to supporting women in reclaiming their inner authority and stepping into conscious leadership."}', '["title","body"]', 1),
(60002, 'content', 3, 'The Depth Beneath', '{"title":"The Depth Beneath","body":"Beyond the surface of personal development lies a profound journey of self-discovery and transformation."}', '["title","body"]', 1),
(60002, 'newsletter', 4, 'Newsletter Signup', '{"title":"Stay Connected","body":"Join our community for insights and updates.","ctaText":"Subscribe"}', '["title","ctaText"]', 1);

-- =====================================================
-- VISION & ETHOS PAGE (pageId = 60003, slug = 'vision-ethos')
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60003, 'hero', 0, 'Vision & Ethos Hero', '{"title":"Vision & Ethos","subtitle":"The guiding principles that shape our work"}', '["title","backgroundImage"]', 1),
(60003, 'content', 1, 'Vision Statement', '{"title":"Our Vision","body":"A world where women lead with clarity, embody their truth, and create from a place of wholeness."}', '["title","body"]', 1),
(60003, 'content', 2, 'Ethos', '{"title":"Our Ethos","body":"We believe in the power of embodied transformation, conscious leadership, and collective responsibility."}', '["title","body"]', 1);

-- =====================================================
-- OFFERINGS PAGE (pageId = 60004, slug = 'offerings')
-- Sections: Hero, Seeds of New Paradigm, She Writes, Emerge With Us, Rooted Unity
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60004, 'hero', 0, 'Offerings Hero', '{"title":"Our Offerings","subtitle":"Pathways to embodied transformation","backgroundUrl":""}', '["title","backgroundImage"]', 1),
(60004, 'grid', 1, 'Offerings Grid', '{"title":"Choose Your Path","items":[{"title":"Seeds of a New Paradigm","description":"The foundational body of work: embodied leadership and conscious self-authority.","imageUrl":"","ctaText":"Explore","ctaUrl":"/offerings/seeds"},{"title":"She Writes","description":"Written reflections on embodiment, discernment, and truth.","imageUrl":"","ctaText":"Read","ctaUrl":"/blog"},{"title":"Emerge With Us","description":"Community gatherings and transformative experiences.","imageUrl":"","ctaText":"Join","ctaUrl":"/community-events"},{"title":"Rooted Unity","description":"Framework for ecological stewardship. Coming Fall 2026.","imageUrl":"","ctaText":"Learn More","ctaUrl":"/rooted-unity"}]}', '["items"]', 1),
(60004, 'cta', 2, 'Offerings CTA', '{"title":"Ready to Begin?","body":"Start your journey of embodied transformation today.","ctaText":"Contact Us","ctaUrl":"/contact"}', '["title","ctaText","ctaUrl"]', 1);

-- =====================================================
-- WORKSHOPS & PROGRAMS PAGE (pageId = 60005, slug = 'workshops-programs')
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60005, 'hero', 0, 'Workshops Hero', '{"title":"Workshops & Programs","subtitle":"Immersive experiences for transformation"}', '["title","backgroundImage"]', 1),
(60005, 'grid', 1, 'Programs Grid', '{"title":"Upcoming Programs","items":[]}', '["items"]', 1),
(60005, 'cta', 2, 'Programs CTA', '{"title":"Custom Programs","body":"Looking for something tailored to your needs?","ctaText":"Contact Us","ctaUrl":"/contact"}', '["title","ctaText","ctaUrl"]', 1);

-- =====================================================
-- VI·X JOURNAL TRILOGY PAGE (pageId = 60006, slug = 'vi-x-journal-trilogy')
-- Sections: Hero, Featured Article, Article List
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60006, 'hero', 0, 'VI·X Journal Hero', '{"title":"VI·X Journal Trilogy","subtitle":"A literary exploration of identity, inheritance, and becoming"}', '["title","backgroundImage"]', 1),
(60006, 'articles', 1, 'Featured Article', '{"title":"Featured","featuredArticleId":null}', '["title"]', 1),
(60006, 'articles', 2, 'Article List', '{"title":"All Entries","showPagination":true}', '["title"]', 1);

-- =====================================================
-- BLOG / SHE WRITES PAGE (pageId = 60007, slug = 'blog')
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60007, 'hero', 0, 'Blog Hero', '{"title":"She Writes","subtitle":"Written reflections on embodiment, discernment, and truth"}', '["title","backgroundImage"]', 1),
(60007, 'articles', 1, 'Blog Articles', '{"title":"Recent Posts","showCategories":true,"showPagination":true}', '["title"]', 1);

-- =====================================================
-- SHOP PAGE (pageId = 60008, slug = 'shop')
-- Sections: Shop Navigation, Product Grid
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60008, 'hero', 0, 'Shop Hero', '{"title":"The Shop","subtitle":"Curated tools for your journey"}', '["title","backgroundImage"]', 1),
(60008, 'products', 1, 'Product Grid', '{"title":"All Products","showCategories":true,"showFilters":true}', '["products"]', 1),
(60008, 'cta', 2, 'Shop CTA', '{"title":"Custom Orders","body":"Looking for something special?","ctaText":"Contact Us","ctaUrl":"/contact"}', '["title","ctaText","ctaUrl"]', 1);

-- =====================================================
-- COMMUNITY EVENTS PAGE (pageId = 60009, slug = 'community-events')
-- Sections: Hero, Calendar Navigation, Calendar Grid, Event Legend, CTA
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60009, 'hero', 0, 'Events Hero', '{"title":"Community Events","subtitle":"Gather, connect, and grow together"}', '["title","backgroundImage"]', 1),
(60009, 'calendar', 1, 'Events Calendar', '{"title":"Upcoming Events","showFilters":true,"eventTypes":[{"type":"workshop","color":"#8B5CF6","label":"Workshop"},{"type":"gathering","color":"#10B981","label":"Gathering"},{"type":"retreat","color":"#F59E0B","label":"Retreat"}]}', '["title"]', 1),
(60009, 'cta', 2, 'Events CTA', '{"title":"Host an Event","body":"Interested in hosting a Just Empower event in your community?","ctaText":"Get in Touch","ctaUrl":"/contact"}', '["title","ctaText","ctaUrl"]', 1);

-- =====================================================
-- RESOURCES PAGE (pageId = 60010, slug = 'resources')
-- Sections: Hero, Categories Sidebar, Resource List
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60010, 'hero', 0, 'Resources Hero', '{"title":"Resources","subtitle":"Tools and materials for your journey"}', '["title","backgroundImage"]', 1),
(60010, 'grid', 1, 'Resources Grid', '{"title":"Browse Resources","categories":["Guides","Worksheets","Meditations","Reading Lists"],"showFilters":true}', '["items"]', 1);

-- =====================================================
-- WALK WITH US PAGE (pageId = 60011, slug = 'walk-with-us')
-- Sections: Hero, Membership Options, Video/Media
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60011, 'hero', 0, 'Walk With Us Hero', '{"title":"Walk With Us","subtitle":"Join our community of conscious leaders"}', '["title","backgroundImage"]', 1),
(60011, 'content', 1, 'Community Description', '{"title":"Our Community","body":"A gathering of women committed to personal growth and collective transformation. When you walk with us, you become part of a supportive network dedicated to embodied leadership."}', '["title","body"]', 1),
(60011, 'features', 2, 'Membership Benefits', '{"title":"What You Get","items":[{"title":"Monthly Gatherings","description":"Virtual and in-person community events"},{"title":"Exclusive Content","description":"Access to members-only resources and reflections"},{"title":"Direct Connection","description":"Opportunities to connect with Justice and fellow members"},{"title":"Early Access","description":"First access to new offerings and events"}]}', '["title","items"]', 1),
(60011, 'video', 3, 'Community Video', '{"title":"See Our Community","videoUrl":"","posterImage":""}', '["videoUrl"]', 1),
(60011, 'cta', 4, 'Walk With Us CTA', '{"title":"Ready to Join?","body":"Take the first step on your journey with us.","ctaText":"Apply Now","ctaUrl":"/contact"}', '["title","ctaText","ctaUrl"]', 1);

-- =====================================================
-- CONTACT PAGE (pageId = 60012, slug = 'contact')
-- Sections: Hero, Contact Info, Contact Form, Map
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) VALUES
(60012, 'hero', 0, 'Contact Hero', '{"title":"Get in Touch","subtitle":"We would love to hear from you"}', '["title","backgroundImage"]', 1),
(60012, 'content', 1, 'Contact Info', '{"title":"Contact Information","email":"hello@justxempower.com","phone":"","address":"Austin, Texas","socialLinks":[{"platform":"instagram","url":"https://instagram.com/justxempower"},{"platform":"linkedin","url":"https://linkedin.com/company/justxempower"}]}', '["title","body"]', 1),
(60012, 'form', 2, 'Contact Form', '{"title":"Send a Message","fields":[{"name":"name","label":"Your Name","type":"text","required":true},{"name":"email","label":"Email Address","type":"email","required":true},{"name":"subject","label":"Subject","type":"text","required":false},{"name":"message","label":"Your Message","type":"textarea","required":true}],"submitText":"Send Message","successMessage":"Thank you for reaching out. We will be in touch soon."}', '["fields","submitText"]', 1),
(60012, 'map', 3, 'Location Map', '{"title":"Find Us","location":"Austin, Texas","coordinates":{"lat":30.2672,"lng":-97.7431}}', '["location"]', 1);

-- =====================================================
-- ROOTED UNITY PAGE (pageId for rooted-unity)
-- =====================================================

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) 
SELECT p.id, 'hero', 0, 'Rooted Unity Hero', '{"title":"Rooted Unity","subtitle":"Ecological stewardship meets personal healing","comingSoon":"Fall 2026"}', '["title","backgroundImage"]', 1
FROM pages p WHERE p.slug = 'rooted-unity' LIMIT 1;

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) 
SELECT p.id, 'content', 1, 'Rooted Unity Content', '{"title":"The Vision","body":"Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self."}', '["title","body"]', 1
FROM pages p WHERE p.slug = 'rooted-unity' LIMIT 1;

INSERT INTO pageSections (pageId, sectionType, sectionOrder, title, content, requiredFields, isVisible) 
SELECT p.id, 'newsletter', 2, 'Rooted Unity Newsletter', '{"title":"Be the First to Know","body":"Sign up to receive updates when Rooted Unity launches.","ctaText":"Join Waitlist"}', '["title","ctaText"]', 1
FROM pages p WHERE p.slug = 'rooted-unity' LIMIT 1;

-- =====================================================
-- PART 4: VERIFICATION QUERIES
-- Run these after seeding to verify data
-- =====================================================

-- Check section counts per page
-- SELECT p.id, p.slug, p.title, COUNT(ps.id) as sectionCount 
-- FROM pages p 
-- LEFT JOIN pageSections ps ON p.id = ps.pageId 
-- GROUP BY p.id 
-- ORDER BY p.id;

-- Check all sections
-- SELECT pageId, sectionType, sectionOrder, title FROM pageSections ORDER BY pageId, sectionOrder;

-- =====================================================
-- END OF SEED FILE
-- =====================================================


-- =====================================================
-- PART 5: SITECONTENT TABLE SEED DATA
-- This is the content that frontend components read from
-- =====================================================

-- Clear existing siteContent (OPTIONAL - uncomment if needed)
-- DELETE FROM siteContent;

-- =====================================================
-- HOME PAGE CONTENT
-- =====================================================

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
-- Hero Section
('home', 'hero', 'title', 'Just Empower'),
('home', 'hero', 'subtitle', 'Catalyzing The Rise of Her'),
('home', 'hero', 'description', 'Where Empowerment Becomes Embodiment — cultivating self-trust, clarity, and conscious leadership.'),
('home', 'hero', 'ctaText', 'Discover More'),
('home', 'hero', 'ctaLink', '/philosophy'),
('home', 'hero', 'videoUrl', ''),

-- Philosophy Preview Section
('home', 'philosophy', 'title', 'The Philosophy'),
('home', 'philosophy', 'subtitle', 'OUR APPROACH'),
('home', 'philosophy', 'description', 'Just Empower operates at the intersection of personal reclamation and collective influence. We believe that transformative leadership begins within—through self-trust, discernment, and embodied integrity—and radiates outward into the structures we shape, steward, and reimagine.'),
('home', 'philosophy', 'ctaText', 'Learn More'),
('home', 'philosophy', 'ctaLink', '/philosophy'),

-- Offerings Section
('home', 'offerings', 'title', 'Our Offerings'),
('home', 'offerings', 'subtitle', 'SCROLL TO EXPLORE'),

-- Community Section
('home', 'community', 'title', 'Emerge With Us'),
('home', 'community', 'subtitle', 'COMMUNITY'),
('home', 'community', 'description', 'We are planting seeds for a new paradigm—one rooted in consciousness, compassion, and sacred reciprocity. This is an invitation for women ready to move beyond survival patterns and into grounded discernment, embodied presence, and conscious self-authority.'),
('home', 'community', 'ctaText', 'Walk With Us'),
('home', 'community', 'ctaLink', '/walk-with-us'),

-- Rooted Unity Section
('home', 'rooted', 'title', 'Rooted Unity'),
('home', 'rooted', 'subtitle', 'COMING 2026'),
('home', 'rooted', 'description', 'Ecological stewardship meets personal healing. Recognizing that our internal landscape mirrors the external world, we embark on a journey of regenerative living and planetary care—understanding that tending the Earth is an extension of tending the self.')
ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue);

-- =====================================================
-- PHILOSOPHY PAGE CONTENT
-- =====================================================

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('philosophy', 'hero', 'title', 'Our Philosophy'),
('philosophy', 'hero', 'subtitle', 'TRUE TRANSFORMATION IS NOT A CONCEPT—IT IS A LIVED EXPERIENCE.'),
('philosophy', 'hero', 'description', ''),
('philosophy', 'principles', 'title', 'Foundational Principles'),
('philosophy', 'principles', 'principle1_title', 'EMBODIMENT'),
('philosophy', 'principles', 'principle1_description', 'Truth begins where intellect ends—within the lived intelligence of the body and breath. Transformation moves from concept into experience, as the nervous system becomes the gateway to sovereignty.'),
('philosophy', 'principles', 'principle2_title', 'WHOLENESS'),
('philosophy', 'principles', 'principle2_description', 'Wholeness is not something to achieve or restore—it is something to reclaim. The work is not about fixing what is broken, but remembering what endures: clarity, sovereignty, embodied truth.'),
('philosophy', 'principles', 'principle3_title', 'NATURE''S INTELLIGENCE'),
('philosophy', 'principles', 'principle3_description', 'Rather than replicating outdated systems, Just Empower roots its work in nature''s original intelligence—adaptive, regenerative, and quietly revolutionary.')
ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue);

-- =====================================================
-- ABOUT PAGE CONTENT
-- =====================================================

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('about', 'hero', 'title', 'The Founder'),
('about', 'hero', 'subtitle', 'JUSTICE BARTLETT'),
('about', 'hero', 'description', ''),
('about', 'hero', 'videoUrl', ''),
('about', 'hero', 'imageUrl', ''),
('about', 'opening', 'paragraph1', 'Justice Bartlett is the founder of Just Empower, a platform dedicated to embodied leadership and conscious self-authority for women.'),
('about', 'opening', 'paragraph2', 'Her work bridges the gap between personal transformation and collective responsibility.'),
('about', 'opening', 'paragraph3', 'Through writing, frameworks, and curated experiences, she supports women in reclaiming their innate wisdom and leadership.'),
('about', 'truth', 'title', 'The Truth Behind Just Empower'),
('about', 'truth', 'description', 'Just Empower was born from a deep commitment to supporting women in reclaiming their inner authority and stepping into conscious leadership.'),
('about', 'depth', 'title', 'The Depth Beneath'),
('about', 'depth', 'paragraph1', 'Beyond the surface of personal development lies a profound journey of self-discovery and transformation.'),
('about', 'depth', 'paragraph2', ''),
('about', 'depth', 'paragraph3', ''),
('about', 'depth', 'paragraph4', ''),
('about', 'depth', 'paragraph5', ''),
('about', 'remembrance', 'title', 'Remembrance'),
('about', 'remembrance', 'quote', ''),
('about', 'remembrance', 'paragraph1', ''),
('about', 'remembrance', 'paragraph2', ''),
('about', 'remembrance', 'paragraph3', ''),
('about', 'remembrance', 'paragraph4', ''),
('about', 'renewal', 'title', 'Renewal'),
('about', 'renewal', 'paragraph1', ''),
('about', 'renewal', 'paragraph2', ''),
('about', 'future', 'title', 'The Future'),
('about', 'future', 'paragraph1', ''),
('about', 'future', 'paragraph2', ''),
('about', 'future', 'paragraph3', ''),
('about', 'future', 'paragraph4', ''),
('about', 'newsletter', 'title', 'Stay Connected'),
('about', 'newsletter', 'description', 'Join our community for insights and updates on embodied transformation.')
ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue);

-- =====================================================
-- OFFERINGS PAGE CONTENT
-- =====================================================

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('offerings', 'hero', 'title', 'Our Offerings'),
('offerings', 'hero', 'subtitle', 'PATHWAYS TO TRANSFORMATION'),
('offerings', 'hero', 'description', 'Discover the various ways to engage with Just Empower and begin your journey of embodied leadership.')
ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue);

-- =====================================================
-- CONTACT PAGE CONTENT
-- =====================================================

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('contact', 'hero', 'title', 'Connect'),
('contact', 'hero', 'subtitle', 'BEGIN THE CONVERSATION'),
('contact', 'hero', 'videoUrl', ''),
('contact', 'hero', 'imageUrl', ''),
('contact', 'info', 'heading', 'Get in Touch'),
('contact', 'info', 'description', 'Whether you are interested in partnership, coaching, or simply have a question, we invite you to reach out. Our team is dedicated to supporting your journey of empowerment and transformation.'),
('contact', 'info', 'location', 'Austin, Texas'),
('contact', 'info', 'email', 'partners@justxempower.com'),
('contact', 'info', 'instagramUrl', 'https://instagram.com/justxempower'),
('contact', 'info', 'linkedinUrl', 'https://linkedin.com/company/justxempower')
ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue);

-- =====================================================
-- WALK WITH US PAGE CONTENT
-- =====================================================

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('walk-with-us', 'hero', 'title', 'Walk With Us'),
('walk-with-us', 'hero', 'subtitle', 'JOIN THE MOVEMENT'),
('walk-with-us', 'hero', 'description', 'Step into a community of women committed to conscious leadership, embodied wisdom, and collective transformation.'),
('walk-with-us', 'content', 'heading', 'Your Journey Begins Here'),
('walk-with-us', 'content', 'description', 'Whether you are seeking personal transformation, professional development, or community connection, Just Empower offers pathways designed to meet you where you are and guide you toward where you are meant to be.')
ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue);

-- =====================================================
-- RESOURCES PAGE CONTENT
-- =====================================================

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('resources', 'hero', 'title', 'Resources'),
('resources', 'hero', 'subtitle', 'TOOLS FOR TRANSFORMATION'),
('resources', 'hero', 'description', 'Curated materials to support your journey of growth and self-discovery.')
ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue);

-- =====================================================
-- GLOBAL CONTENT (Footer, Newsletter, etc.)
-- =====================================================

INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('global', 'footer', 'tagline', 'Catalyzing the Rise of Her'),
('global', 'footer', 'copyright', '© 2026 JUST EMPOWER™. ALL RIGHTS RESERVED.'),
('global', 'footer', 'instagramUrl', 'https://instagram.com/justxempower'),
('global', 'footer', 'linkedinUrl', 'https://linkedin.com/company/justxempower'),
('global', 'newsletter', 'title', 'Stay Connected'),
('global', 'newsletter', 'description', 'Join our monthly mailing list for insights on embodied transformation, conscious leadership, and the rise of her.'),
('global', 'newsletter', 'ctaText', 'Subscribe'),
('global', 'newsletter', 'privacyText', 'We respect your privacy. Unsubscribe anytime.')
ON DUPLICATE KEY UPDATE contentValue = VALUES(contentValue);

-- =====================================================
-- PART 6: VERIFICATION QUERIES
-- =====================================================

-- Check siteContent by page
-- SELECT page, COUNT(*) as contentCount FROM siteContent GROUP BY page ORDER BY page;

-- Check all content for a specific page
-- SELECT * FROM siteContent WHERE page = 'home' ORDER BY section, contentKey;

-- =====================================================
-- END OF COMPLETE SEED FILE
-- =====================================================
