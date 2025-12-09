# Project TODO

## Completed Features

- [x] Add AdminUser table with username/password authentication
- [x] Create seed script for admin user and initial content
- [x] Build backend APIs for admin authentication
- [x] Build backend APIs for articles management (CRUD + pagination)
- [x] Build backend APIs for site content management (CRUD)
- [x] Create Admin Login page with minimalist design
- [x] Create Admin Dashboard with navigation
- [x] Create Admin Settings page for password/username changes
- [x] Create Content Editor for managing site sections
- [x] Create Article Manager for journal posts
- [x] Refactor Journal page to use API with 'Load More' button
- [x] Test admin portal and public site integration

## Mailchimp Integration

- [x] Add Mailchimp API Key and Audience ID fields to Admin Settings
- [x] Create NewsletterSignup component with email validation
- [x] Implement backend API for Mailchimp subscriber management
- [x] Add newsletter signup form to Footer
- [x] Create scroll-triggered popup modal for newsletter subscription
- [x] Add inline newsletter CTA sections to About and Philosophy pages
- [x] Test Mailchimp integration end-to-end

## Update Discover More Button and About Page

- [x] Scrape content from https://justxempower.com/our-founder/
- [x] Update Home.tsx "Discover More" button to link to /about
- [x] Refactor About.tsx with full founder story content
- [ ] Verify About page displays correctly
- [x] Scrape content from https://justxempower.com/just-empower/
- [ ] Create AboutJustEmpower.tsx page with organization content
- [ ] Update navigation to include both About pages

## Complete CMS Integration (CRITICAL)

- [x] Expand database schema to store ALL page content sections (not just hero) - Schema already supports this
- [x] Create comprehensive seed data for all page sections
- [x] Fix Settings page to properly save and load Mailchimp API keys
- [x] Expand Content Editor to show ALL editable sections for each page
- [x] Refactor Home page to load all content from database
- [x] Refactor About page to load all content from database (hero section)
- [x] Refactor Philosophy, Offerings, Contact pages to load from database (hero sections - main content editable via CMS)
- [x] Fix logo path on Admin Login page
- [x] Test complete system end-to-end

## Media Library System (NEW)

- [x] Create Media database table to track uploaded files
- [x] Build backend API for media upload to S3
- [x] Build backend API for media listing and deletion
- [x] Create Media Manager admin page with upload and gallery
- [x] Create Media Picker modal component for selecting media
- [x] Integrate Media Picker into Content Editor for image/video fields
- [ ] Test complete media upload and selection workflow

## Bug Fixes

- [x] Fix "Back to Dashboard" button navigation in admin pages
