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
- [x] Test complete media upload and selection workflow

## Bug Fixes

- [x] Fix "Back to Dashboard" button navigation in admin pages

## World-Class AI-Powered CMS System (MAJOR UPGRADE)

### Database Schema
- [x] Create ThemeSettings table (colors, fonts, spacing, animations)
- [x] Create BrandAssets table (logos, favicon, social images)
- [x] Create Pages table (dynamic page management)
- [x] Create Navigation table (menu structure)
- [x] Create SEOSettings table (meta tags, Open Graph, per-page SEO)
- [x] Create SiteSettings table (analytics, custom code, integrations)
- [x] Create AI Chat Conversations table
- [x] Create AI Settings table
- [x] Integrate Gemini AI SDK
- [x] Build AI service layer with Just Empower™ system architecture

### Admin Pages - Design System
- [ ] Theme Settings page (color palette, typography, spacing system)
- [ ] Font Manager (upload custom fonts, Google Fonts integration)
- [ ] Animation Controls (GSAP settings, scroll effects)

### Admin Pages - Brand Management
- [ ] Brand Assets page (logo variants, favicon uploader)
- [ ] Social Media settings (OG images, Twitter cards)

### Admin Pages - Content Management
- [ ] Pages Manager (create/edit/delete pages, page templates)
- [ ] Navigation Editor (header/footer menu builder)
- [ ] Form Builder (customize contact form fields)

### Admin Pages - SEO & Analytics
- [ ] SEO Manager (per-page meta tags, structured data)
- [ ] Analytics Integration (Google Analytics, custom tracking codes)
- [ ] Redirects Manager (URL management)

### Admin Pages - Advanced
- [ ] Custom Code Injection (CSS/JS editor with syntax highlighting)
- [ ] Backup & Restore (version control, rollback)
- [ ] User Management (multiple admins, roles & permissions)

### Dashboard Improvements
- [ ] Comprehensive sidebar navigation with categories
- [ ] Real-time statistics dashboard
- [ ] Quick action cards for all features
- [ ] Activity log/recent changes

### Backend APIs
- [ ] Theme settings CRUD endpoints
- [ ] Brand assets upload/management endpoints
- [ ] Pages CRUD endpoints
- [ ] Navigation CRUD endpoints
- [ ] SEO settings endpoints
- [ ] Site settings endpoints

### AI Integration
- [x] Gemini API key configured and validated
- [x] Just Empower™ AI System Architecture integrated
- [x] AI Chat Assistant for public site (sovereign voice)
- [x] AI chat backend API with conversation memory
- [x] AI chat frontend widget with beautiful UI
- [ ] AI content generation in admin (articles, meta tags)
- [ ] AI color palette generator
- [ ] AI font pairing suggestions
- [ ] AI image alt text generation
- [ ] AI SEO optimization

### Bug Fixes
- [x] Fix admin dashboard route (/admin vs /admin/dashboard)
- [x] Fix logo path in all admin pages

## AI Enhancements (NEW)

- [x] Build Theme Settings admin page with AI color palette generator
- [x] Build Theme Settings admin page with AI font pairing suggestions
- [x] Add rating system to AI chat responses (thumbs up/down)
- [x] Add qualitative feedback form for AI responses
- [x] Implement visitor ID tracking for returning users
- [x] Enhance conversation memory to recall previous sessions by visitor ID
- [x] Store visitor preferences and context across sessions

## Real-Time Analytics Dashboard (NEW)

- [x] Create analytics database tables for tracking visitor interactions
- [x] Build backend API for recording page views, sessions, and events
- [x] Build backend API for aggregating analytics data
- [x] Create Analytics admin page with real-time visitor stats
- [x] Add AI chat effectiveness metrics (satisfaction rates, topics, sentiment)
- [x] Add popular pages and content performance charts
- [x] Add real-time activity feed
- [x] Integrate AI-powered insights and recommendations
- [x] Add data visualization with charts and graphs
- [x] Test analytics tracking on public site

## Pages Manager & Enhanced Analytics (NEW)

- [x] Build visual Pages Manager admin page
- [x] Add page creation with title, slug, and SEO settings
- [x] Add page editing and deletion
- [x] Add page reordering functionality with drag-and-drop
- [ ] Build page renderer for dynamically created pages
- [ ] Add section/block system for page content
- [ ] Enhance AI chat analytics with topic tracking
- [ ] Add sentiment analysis trends over time charts
- [ ] Build weekly email summary system
- [ ] Create email template for analytics reports
- [ ] Add email scheduling and delivery

## Admin Navigation Fix (NEW)

- [x] Remove redundant "Back to Dashboard" buttons from all admin pages
- [x] Ensure sidebar navigation is consistent across all admin pages
- [ ] Fix admin session persistence issue

## Visual Block Editor for Pages (NEW)

- [ ] Create pageBlocks database table to store content blocks
- [ ] Build backend API for creating, updating, deleting, and reordering blocks
- [ ] Create Text Block component with rich text editor
- [ ] Create Image Block component with Media Library integration
- [ ] Create Video Block component
- [ ] Create Quote Block component
- [ ] Create CTA Block component
- [ ] Create Spacer Block component
- [ ] Integrate block editor into Pages Manager with drag-and-drop
- [ ] Add block settings panel (alignment, colors, spacing)
- [ ] Build dynamic page renderer to display blocks on public site
- [ ] Add live preview mode
- [ ] Test complete block editor workflow

## Sidebar Navigation Consistency Fix (URGENT)

- [x] Audit all admin pages (Content, Articles, Media, Theme, Pages, Analytics, Settings)
- [x] Add missing nav items (Theme, Pages, Analytics) to pages that don't have them
- [x] Ensure all 7 nav items appear on every admin page sidebar
- [x] Test navigation consistency across all admin pages


## Critical Bug: Admin Session Expires During Save Operations (URGENT)

- [x] Investigate why admin session expires/redirects to login when saving content
- [x] Check adminProcedure authentication middleware
- [x] Fix session persistence during tRPC mutations (implemented database-backed sessions)
- [x] Test that content saves without logout (vitest tests pass)
- [x] Verify all admin operations maintain session (vitest tests pass)
