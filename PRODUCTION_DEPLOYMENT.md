# JustEmpower Production Deployment Guide

This document provides the commands to deploy the latest CMS implementation to your production EC2 server and seed the AWS RDS MySQL database.

## Prerequisites

- AWS Systems Manager Session Manager access to EC2 instance
- MySQL client access to AWS RDS (either via EC2 or direct connection)
- GitHub repository has the latest code (already pushed)

---

## Part 1: EC2 Deployment Commands

Connect to your EC2 instance via AWS Systems Manager Session Manager, then run the following commands:

```bash
# Navigate to the project directory
cd /var/www/justxempower

# Pull the latest code from GitHub
git pull origin main

# Install any new dependencies
pnpm install

# Build the production application
pnpm build

# Restart the PM2 process
pm2 restart justxempower

# Verify the process is running
pm2 status

# Check logs for any errors
pm2 logs justxempower --lines 50
```

### Quick One-Liner (Copy & Paste)

```bash
cd /var/www/justxempower && git pull origin main && pnpm install && pnpm build && pm2 restart justxempower && pm2 status
```

---

## Part 2: Database Schema Sync (If Needed)

If there are schema changes, run the Drizzle migration on the EC2 server:

```bash
cd /var/www/justxempower && pnpm db:push
```

---

## Part 3: AWS RDS MySQL Database Seeding

Connect to your AWS RDS MySQL database using the MySQL client:

```bash
mysql -h justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com -u justxempower -p justxempower
```

When prompted, enter the password: `JustEmpower2025Secure`

Then run the SQL commands from the next section.

---

## Part 4: SQL Seed Data for Production

### 4.1 Clear Existing Data (Optional - Only if you want a fresh start)

```sql
-- WARNING: This will delete all existing navigation, carousel, and site content data
-- Only run this if you want to start fresh

DELETE FROM navigation;
DELETE FROM carouselOfferings;
DELETE FROM siteContent WHERE page = 'global';
```

### 4.2 Seed Navigation Items

```sql
-- Header Navigation (Main Menu)
INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab, parentId) VALUES
('header', 'Philosophy', '/philosophy', 1, 0, 0, NULL),
('header', 'Offerings', '/offerings', 2, 0, 0, NULL),
('header', 'Journal', '/journal', 3, 0, 0, NULL),
('header', 'Shop', '/shop', 4, 0, 0, NULL),
('header', 'Events', '/events', 5, 0, 0, NULL),
('header', 'Contact', '/contact', 6, 0, 0, NULL),
('header', 'Walk With Us', '/walk-with-us', 7, 0, 0, NULL);

-- Get the ID of Philosophy to add children
SET @philosophyId = (SELECT id FROM navigation WHERE label = 'Philosophy' AND location = 'header' LIMIT 1);

-- Philosophy Dropdown Children
INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab, parentId) VALUES
('header', 'Founder', '/philosophy/founder', 1, 0, 0, @philosophyId),
('header', 'Vision & Ethos', '/philosophy/vision-ethos', 2, 0, 0, @philosophyId);

-- Get the ID of Offerings to add children
SET @offeringsId = (SELECT id FROM navigation WHERE label = 'Offerings' AND location = 'header' AND parentId IS NULL LIMIT 1);

-- Offerings Dropdown Children
INSERT INTO navigation (location, label, url, `order`, isExternal, openInNewTab, parentId) VALUES
('header', 'Living Codex', '/offerings/living-codex', 1, 0, 0, @offeringsId),
('header', 'MOM VI•X', '/offerings/mom-vix', 2, 0, 0, @offeringsId),
('header', 'BloomXFlight', '/offerings/bloomxflight', 3, 0, 0, @offeringsId),
('header', 'She Writes', '/offerings/she-writes', 4, 0, 0, @offeringsId),
('header', 'Workshops', '/offerings/workshops', 5, 0, 0, @offeringsId),
('header', 'Rooted Unity', '/offerings/rooted-unity', 6, 0, 0, @offeringsId);

-- Footer Navigation
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
```

### 4.3 Seed Carousel Offerings

```sql
-- Carousel Offerings for Homepage
INSERT INTO carouselOfferings (title, description, link, imageUrl, `order`, isActive) VALUES
('Living Codex', 'A transformative journey through sacred texts and embodied wisdom practices.', '/offerings/living-codex', '/images/offerings/living-codex.jpg', 1, 1),
('MOM VI•X', 'Mothers of Magnificence - A sacred container for conscious motherhood.', '/offerings/mom-vix', '/images/offerings/mom-vix.jpg', 2, 1),
('BloomXFlight', 'Somatic healing and movement practices for embodied transformation.', '/offerings/bloomxflight', '/images/offerings/bloomxflight.jpg', 3, 1),
('She Writes', 'Creative writing circles for women finding their authentic voice.', '/offerings/she-writes', '/images/offerings/she-writes.jpg', 4, 1),
('Workshops', 'Immersive experiences for personal and collective evolution.', '/offerings/workshops', '/images/offerings/workshops.jpg', 5, 1),
('Rooted Unity', 'Ecological stewardship meets personal healing - Coming 2026.', '/offerings/rooted-unity', '/images/offerings/rooted-unity.jpg', 6, 1);
```

### 4.4 Seed Global Content (Footer, Newsletter Popup)

```sql
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
```

---

## Part 5: Verification

After deployment, verify the following:

1. **Site is accessible**: Visit https://justxempower.com
2. **Navigation displays**: Check that header and footer navigation items appear
3. **Carousel works**: Check that the homepage carousel shows offerings from the database
4. **No console errors**: Open browser DevTools and check for JavaScript errors

### Check Database Data via MySQL

```sql
-- Verify navigation items
SELECT id, location, label, url, parentId FROM navigation ORDER BY location, `order`;

-- Verify carousel offerings
SELECT id, title, isActive, `order` FROM carouselOfferings ORDER BY `order`;

-- Verify global content
SELECT page, section, contentKey, contentValue FROM siteContent WHERE page = 'global';
```

---

## Troubleshooting

### PM2 Process Not Starting

```bash
# Check PM2 logs
pm2 logs justxempower --lines 100

# Check if port 8083 is in use
netstat -tlnp | grep 8083

# Kill any zombie processes
pm2 delete justxempower
pm2 start ecosystem.config.cjs
```

### Database Connection Issues

```bash
# Test MySQL connection from EC2
mysql -h justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com -u justxempower -p -e "SELECT 1"
```

### Nginx Issues

```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## Summary

| Step | Command/Action |
|------|----------------|
| 1. Connect to EC2 | AWS Systems Manager Session Manager |
| 2. Pull code | `cd /var/www/justxempower && git pull origin main` |
| 3. Install deps | `pnpm install` |
| 4. Build | `pnpm build` |
| 5. Restart | `pm2 restart justxempower` |
| 6. Seed DB | Connect to RDS MySQL and run SQL INSERT statements |
| 7. Verify | Visit https://justxempower.com |

---

**Document Version:** 1.0  
**Last Updated:** January 4, 2025  
**Author:** Manus AI
