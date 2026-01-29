-- Add missing media fields (imageUrl, videoUrl) for all pages and sections
-- This ensures MediaPicker is available in Content Editor for all media locations

-- HOME PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('home', 'hero', 'videoUrl', ''),
('home', 'hero', 'imageUrl', ''),
('home', 'philosophy', 'imageUrl', ''),
('home', 'community', 'imageUrl', ''),
('home', 'pointsOfAccess', 'imageUrl', '');

-- FOUNDER PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('founder', 'hero', 'videoUrl', ''),
('founder', 'hero', 'imageUrl', '');

-- ABOUT PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('about', 'hero', 'videoUrl', ''),
('about', 'hero', 'imageUrl', '');

-- PHILOSOPHY PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('philosophy', 'hero', 'videoUrl', ''),
('philosophy', 'hero', 'imageUrl', ''),
('philosophy', 'principles', 'imageUrl', ''),
('philosophy', 'pillars', 'imageUrl', '');

-- OFFERINGS PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('offerings', 'hero', 'videoUrl', ''),
('offerings', 'hero', 'imageUrl', ''),
('offerings', 'seeds', 'imageUrl', ''),
('offerings', 'sheWrites', 'imageUrl', ''),
('offerings', 'emerge', 'imageUrl', ''),
('offerings', 'rootedUnity', 'imageUrl', '');

-- WALK WITH US PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('walk-with-us', 'hero', 'videoUrl', ''),
('walk-with-us', 'hero', 'imageUrl', ''),
('walk-with-us', 'quote', 'imageUrl', ''),
('walk-with-us', 'options', 'option1_imageUrl', ''),
('walk-with-us', 'options', 'option2_imageUrl', ''),
('walk-with-us', 'options', 'option3_imageUrl', '');

-- CONTACT PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('contact', 'hero', 'videoUrl', ''),
('contact', 'hero', 'imageUrl', '');

-- EVENTS PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('events', 'hero', 'videoUrl', ''),
('events', 'hero', 'imageUrl', '');

-- RESOURCES PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('resources', 'hero', 'videoUrl', ''),
('resources', 'hero', 'imageUrl', '');

-- BLOG PAGE
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('blog', 'hero', 'videoUrl', ''),
('blog', 'hero', 'imageUrl', '');

-- Verify the media fields were added
SELECT page, section, contentKey FROM siteContent 
WHERE contentKey LIKE '%imageUrl%' OR contentKey LIKE '%videoUrl%'
ORDER BY page, section, contentKey;
