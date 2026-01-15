-- Seed existing site pages into the pages table
-- Run this on the production database to populate the Page Library

INSERT INTO pages (title, slug, template, metaTitle, metaDescription, published, showInNav, navOrder, createdAt, updatedAt)
VALUES 
  ('Home', 'home', 'content-editor', 'Just Empower | Where Empowerment Becomes Embodiment', 'Catalyzing the Rise of Her. Welcome to Just Empower - where empowerment becomes embodiment.', 1, 1, 1, NOW(), NOW()),
  ('About the Founder', 'about', 'content-editor', 'About April Gambardella | Just Empower', 'Meet April Gambardella, founder of Just Empower and steward of embodied change.', 1, 1, 2, NOW(), NOW()),
  ('About Just Empower', 'about-just-empower', 'content-editor', 'About Just Empower | Our Mission', 'Learn about Just Empower''s mission to catalyze the rise of conscious leadership.', 1, 1, 3, NOW(), NOW()),
  ('Philosophy', 'philosophy', 'content-editor', 'Our Philosophy | Just Empower', 'Discover the philosophy behind Just Empower''s approach to empowerment and transformation.', 1, 1, 4, NOW(), NOW()),
  ('Offerings', 'offerings', 'content-editor', 'Offerings | Just Empower', 'Explore our workshops, programs, and transformational offerings.', 1, 1, 5, NOW(), NOW()),
  ('Journal', 'journal', 'content-editor', 'Journal | Just Empower', 'Read insights and reflections from Just Empower.', 1, 1, 6, NOW(), NOW()),
  ('Contact', 'contact', 'content-editor', 'Contact Us | Just Empower', 'Get in touch with Just Empower.', 1, 1, 7, NOW(), NOW()),
  ('Shop', 'shop', 'content-editor', 'Shop | Just Empower', 'Browse our collection of products and resources.', 1, 1, 8, NOW(), NOW()),
  ('Events', 'events', 'content-editor', 'Events | Just Empower', 'Discover upcoming events and gatherings.', 1, 1, 9, NOW(), NOW()),
  ('Resources', 'resources', 'content-editor', 'Resources | Just Empower', 'Access our library of resources and tools.', 1, 1, 10, NOW(), NOW()),
  ('Walk With Us', 'walk-with-us', 'content-editor', 'Walk With Us | Just Empower', 'Join our community and walk with us on this journey.', 1, 1, 11, NOW(), NOW()),
  ('Privacy Policy', 'privacy-policy', 'content-editor', 'Privacy Policy | Just Empower', 'Read our privacy policy.', 1, 0, 100, NOW(), NOW()),
  ('Terms of Service', 'terms-of-service', 'content-editor', 'Terms of Service | Just Empower', 'Read our terms of service.', 1, 0, 101, NOW(), NOW()),
  ('Accessibility Statement', 'accessibility', 'content-editor', 'Accessibility | Just Empower', 'Our commitment to accessibility.', 1, 0, 102, NOW(), NOW()),
  ('Cookie Policy', 'cookie-policy', 'content-editor', 'Cookie Policy | Just Empower', 'Learn about our use of cookies.', 1, 0, 103, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  template = VALUES(template),
  metaTitle = VALUES(metaTitle),
  metaDescription = VALUES(metaDescription),
  published = VALUES(published),
  showInNav = VALUES(showInNav),
  navOrder = VALUES(navOrder),
  updatedAt = NOW();

-- Verify the pages were inserted
SELECT COUNT(*) as total_pages FROM pages;
SELECT id, title, slug, template, showInNav FROM pages ORDER BY navOrder;
