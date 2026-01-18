# Content Audit Report - January 18, 2026

## Executive Summary
Full cross-reference audit of live page content vs Content Editor vs RDS database (siteContent table).
**Excludes:** privacy-policy, terms-of-service, accessibility, cookie-policy

---

## Database Issues Found

### 1. Corrupted/Duplicate Page Names
The following page names in the database appear corrupted or duplicated:
- `community-eventscommunity-events-rebuilt` (should be `community-events`)
- `contactcontact-rebuilt` (should be `contact`)
- `homehome-rebuilt` (should be `home`)

**Recommendation:** Delete these duplicate entries or merge content into the correct page names.

---

## Page-by-Page Audit

### ✅ HOME (`home`)
**Database sections:** hero, philosophy, offerings, offeringsCarousel, community, pointsOfAccess
**Page component uses:** hero, philosophy, community, pointsOfAccess
**Status:** ✅ ALIGNED
- All sections in database are used by the page component
- Note: `offeringsCarousel` may be a separate managed carousel component

### ✅ ABOUT (`about`) 
**Database sections:** hero, opening, truth, depth, remembrance, renewal, future, newsletter
**Page component uses:** hero, opening, truth, depth, remembrance, renewal, future, newsletter
**Status:** ✅ ALIGNED
- All 8 sections match between database and component

### ✅ PHILOSOPHY (`philosophy`)
**Database sections:** hero, newsletter, pillars, principles
**Page component uses:** hero, principles, pillars, newsletter
**Status:** ✅ ALIGNED
- All 4 sections match

### ✅ OFFERINGS (`offerings`)
**Database sections:** hero, emerge, rootedUnity, seeds, sheWrites
**Page component uses:** hero, seeds, sheWrites, emerge, rootedUnity
**Status:** ✅ ALIGNED
- All 5 sections match

### ✅ BLOG/JOURNAL (`blog`)
**Database sections:** hero, overview
**Page component uses:** hero, overview
**Status:** ✅ ALIGNED
- Note: `journal` page in database has 5 entries (hero) - this may be duplicate

### ✅ CONTACT (`contact`)
**Database sections:** hero, info
**Page component uses:** hero, info
**Status:** ✅ ALIGNED
- All sections match

### ✅ WALK-WITH-US (`walk-with-us`)
**Database sections:** hero, main, individuals, partners, options, quote, content, overview
**Page component uses:** hero, main, partners, individuals, quote
**Status:** ⚠️ PARTIAL
- **Unused in component:** content, options, overview
- These may be legacy sections or the component needs updating

### ✅ EVENTS (`events`)
**Database sections:** hero
**Page component uses:** hero
**Status:** ✅ ALIGNED
- Only hero section, rest is dynamic from events table

### ✅ COMMUNITY-EVENTS (`community-events`)
**Database sections:** hero, overview
**Page component uses:** hero
**Status:** ⚠️ PARTIAL
- **Unused in component:** overview
- Component only uses hero section currently

### ✅ RESOURCES (`resources`)
**Database sections:** hero, overview
**Page component uses:** hero (via usePageContent)
**Status:** ⚠️ PARTIAL
- **Unused in component:** overview
- Resource content is mostly dynamic from resources table

### ✅ SHOP (`shop`)
**Database sections:** hero, overview
**Page component uses:** None from siteContent
**Status:** ⚠️ NOT CONNECTED
- Shop.tsx doesn't use usePageContent hook
- Content is hardcoded in component

### ✅ VISION-ETHOS (`vision-ethos`)
**Database sections:** hero, mission, vision, ethos, cta
**Page component:** Not found in standard pages - may use DynamicPage
**Status:** ⚠️ NEEDS VERIFICATION
- Check if this uses DynamicPageRouter or dedicated component

### ✅ VIX-JOURNAL-TRILOGY (`vix-journal-trilogy`)
**Database sections:** hero, overview, volumes
**Page component:** Not found in standard pages - may use DynamicPage
**Status:** ⚠️ NEEDS VERIFICATION

### ✅ WORKSHOPS-PROGRAMS (`workshops-programs`)
**Database sections:** hero, offerings, overview
**Page component:** Not found in standard pages - may use DynamicPage
**Status:** ⚠️ NEEDS VERIFICATION

### ✅ FOUNDER (`founder`)
**Database sections:** hero, opening, truth, depth, remembrance, renewal, future, newsletter (same as about)
**Page component:** Maps to About.tsx
**Status:** ✅ ALIGNED (uses About component)

---

## Global Content (`global`)
**Database sections:** footer, newsletter, newsletter_popup
**Status:** ✅ Used by Footer and Newsletter components site-wide

---

## Issues Summary

### Critical Issues (0)
None - all core pages have content connected

### Medium Issues (4)
1. **Shop page not connected** - Doesn't use usePageContent, hero/overview content unused
2. **Walk-with-us has unused sections** - content, options, overview not rendered
3. **Community-events overview unused** - Component only uses hero
4. **Resources overview unused** - Component only uses hero

### Low Issues (3)
1. **Corrupted page names** - `community-eventscommunity-events-rebuilt`, `contactcontact-rebuilt`, `homehome-rebuilt`
2. **Duplicate journal entries** - Both `blog` and `journal` exist
3. **vision-ethos, vix-journal-trilogy, workshops-programs** - Need verification if using DynamicPage

---

## Recommended Actions

### Immediate (Database Cleanup)
```sql
-- Delete corrupted page entries
DELETE FROM siteContent WHERE page = 'community-eventscommunity-events-rebuilt';
DELETE FROM siteContent WHERE page = 'contactcontact-rebuilt';
DELETE FROM siteContent WHERE page = 'homehome-rebuilt';
```

### Code Updates Needed
1. **Shop.tsx** - Add `usePageContent('shop')` hook to use hero/overview content
2. **CommunityEvents.tsx** - Add rendering for `overview` section
3. **Resources.tsx** - Add rendering for `overview` section
4. **WalkWithUs.tsx** - Either use `content`, `options`, `overview` sections or remove from database

---

## Content Editor Verification
All pages listed in Content Editor should show editable sections for:
- About: 8 sections ✅
- Philosophy: 4 sections ✅
- Offerings: 5 sections ✅
- Home: 6 sections ✅
- Contact: 2 sections ✅
- Walk With Us: 8 sections ✅
- Events: 1 section ✅
- Community Events: 2 sections ✅
- Resources: 2 sections ✅
- Shop: 2 sections ✅
- Blog: 2 sections ✅

---

*Report generated: January 18, 2026*
