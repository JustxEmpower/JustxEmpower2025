-- Add ctaLink fields for all sections that have ctaText
-- This enables CTA buttons to render (they require both ctaText AND ctaLink)

-- Home page sections
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) 
SELECT 'home', section, 'ctaLink', '/philosophy'
FROM siteContent WHERE page='home' AND contentKey='ctaText' AND contentValue != '';

-- Philosophy page sections  
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue)
SELECT 'philosophy', section, 'ctaLink', '/offerings'
FROM siteContent WHERE page='philosophy' AND contentKey='ctaText' AND contentValue != '';

-- About page sections
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue)
SELECT 'about', section, 'ctaLink', '/philosophy'
FROM siteContent WHERE page='about' AND contentKey='ctaText' AND contentValue != '';

-- Founder page sections
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue)
SELECT 'founder', section, 'ctaLink', '/philosophy'
FROM siteContent WHERE page='founder' AND contentKey='ctaText' AND contentValue != '';

-- Offerings page sections
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue)
SELECT 'offerings', section, 'ctaLink', '/contact'
FROM siteContent WHERE page='offerings' AND contentKey='ctaText' AND contentValue != '';

-- All other pages - add ctaLink with default value
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue)
SELECT page, section, 'ctaLink', '/contact'
FROM siteContent WHERE contentKey='ctaText' AND contentValue != ''
AND page NOT IN ('home', 'philosophy', 'about', 'founder', 'offerings');

-- Show what was added
SELECT page, section, contentKey, contentValue FROM siteContent WHERE contentKey='ctaLink';
