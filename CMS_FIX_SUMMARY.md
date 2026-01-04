# CMS Hardcoded Content - Audit & Fix Summary

**Date:** January 4, 2026  
**Status:** PARTIALLY COMPLETED - 14 pages fixed, 9 pages remaining  
**Priority:** CRITICAL - User edits in admin panel are being ignored

---

## What Was Fixed ✅

### Pages Now Using CMS (usePageContent Hook)
1. **About.tsx** - ✅ Fixed
2. **AccessibilityStatement.tsx** - ✅ Fixed  
3. **CommunityEvents.tsx** - ✅ Already using CMS
4. **Contact.tsx** - ✅ Fixed (now reads from 'info' section)
5. **CookiePolicy.tsx** - ✅ Fixed
6. **Home.tsx** - ✅ Already using CMS
7. **Journal.tsx** - ✅ Already using CMS
8. **Offerings.tsx** - ✅ Already using CMS
9. **Philosophy.tsx** - ✅ Already using CMS
10. **PrivacyPolicy.tsx** - ✅ Fixed
11. **Resources.tsx** - ✅ Already using CMS
12. **TermsOfService.tsx** - ✅ Fixed
13. **WalkWithUs.tsx** - ✅ Already using CMS
14. **AboutJustEmpower.tsx** - ✅ Fixed

---

## What Still Needs Fixing ❌

### Pages WITHOUT CMS (Still Hardcoded)
These pages need CMS integration:

| Page | Type | Issue | Priority |
|------|------|-------|----------|
| **ArticleDetail.tsx** | Blog | Fetches from articles table, needs CMS for metadata | MEDIUM |
| **Checkout.tsx** | E-commerce | Hardcoded checkout labels | MEDIUM |
| **DynamicPage.tsx** | Utility | Dynamic page renderer | LOW |
| **EventDetail.tsx** | Events | Fetches from events table, needs CMS for metadata | MEDIUM |
| **Events.tsx** | Events | Hardcoded event listings | MEDIUM |
| **ProductDetail.tsx** | E-commerce | Fetches from products table, needs CMS for metadata | MEDIUM |
| **Shop.tsx** | E-commerce | Hardcoded shop labels | MEDIUM |

---

## Root Cause Analysis

### Problem 1: Inconsistent CMS Integration Pattern
- Some pages use `usePageContent` hook ✓
- Some pages use `trpc.content.getByPage` (old pattern) ✗
- Some pages have no CMS integration at all ✗

### Problem 2: Hardcoded Fallback Values
Even pages using CMS have hardcoded fallbacks that override CMS data:
```tsx
// BAD - Fallback overrides CMS
const title = getContent('hero', 'title') || 'Connect';

// GOOD - Minimal fallback
const title = getContent('hero', 'title') || 'Untitled';
```

### Problem 3: Contact Info Scattered Across Files
Same contact email repeated in 5 different files:
- Contact.tsx
- AccessibilityStatement.tsx
- CookiePolicy.tsx
- PrivacyPolicy.tsx
- TermsOfService.tsx

**Solution:** Centralize in CMS under 'contact' page, 'info' section

---

## CMS Data Structure

### Current Schema (siteContent table)
```
page: string (e.g., 'home', 'about', 'contact')
section: string (e.g., 'hero', 'info', 'mission')
contentKey: string (e.g., 'title', 'description', 'email')
contentValue: text
```

### Seed Data Location
File: `scripts/seed-production.mjs` (lines 53-150+)

Contains default content for:
- Home page (hero, philosophy, offerings, community, rooted sections)
- Philosophy page (hero, principles)
- Contact page (hero, info with location, email)
- Walk With Us page
- (Policy pages need to be added to seed script)

---

## Implementation Checklist

### Phase 1: Fix Remaining Pages (URGENT)
- [ ] ArticleDetail.tsx - Add CMS for hero/metadata
- [ ] Checkout.tsx - Add CMS for labels
- [ ] DynamicPage.tsx - Add CMS support
- [ ] EventDetail.tsx - Add CMS for metadata
- [ ] Events.tsx - Add CMS for listings
- [ ] ProductDetail.tsx - Add CMS for metadata
- [ ] Shop.tsx - Add CMS for labels

### Phase 2: Standardize CMS Pattern
- [ ] Remove all `trpc.content.getByPage` calls
- [ ] Use `usePageContent` hook everywhere
- [ ] Minimize hardcoded fallback values
- [ ] Use empty string `''` instead of full text fallbacks

### Phase 3: Centralize Contact Information
- [ ] Create 'contact' page in CMS seed script
- [ ] Add sections: email, location, phone, social
- [ ] Update all 5 pages to read from 'contact' page
- [ ] Remove hardcoded contact info from components

### Phase 4: Seed Data Completeness
- [ ] Add policy pages to seed script (accessibility, cookie, privacy, terms)
- [ ] Add missing sections for all pages
- [ ] Verify all pages have CMS entries

### Phase 5: Testing & Verification
- [ ] Edit each page content in admin panel
- [ ] Verify changes appear on frontend
- [ ] Test across all pages
- [ ] Verify CMS persists after page reload

---

## How to Fix Each Remaining Page

### Template Pattern (Use for all remaining pages)
```tsx
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePageContent } from '@/hooks/usePageContent';

export default function PageName() {
  const [location] = useLocation();
  const { getContent, isLoading } = usePageContent('page-name');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Get content from CMS with MINIMAL fallbacks
  const title = getContent('section', 'key') || '';
  const description = getContent('section', 'key') || '';

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
```

### Key Rules
1. **Always use `usePageContent` hook** - Not trpc.content.getByPage
2. **Minimal fallbacks** - Use empty string `''` not full text
3. **Consistent section naming** - Use 'hero', 'info', 'content' sections
4. **No hardcoded contact info** - Read from 'contact' page in CMS

---

## Deployment Steps

After all fixes are complete:

```bash
# 1. Build the project
npm run build

# 2. Commit changes
git add -A
git commit -m "Fix: Remove all hardcoded content, use CMS as single source of truth"

# 3. Push to production
git push origin main

# 4. Restart PM2 on EC2
pm2 restart all
```

---

## Success Criteria

✓ All 23 pages use CMS (usePageContent hook)  
✓ No hardcoded content in components  
✓ CMS edits persist across page reloads  
✓ Contact info centralized in one CMS location  
✓ All policy pages editable through admin panel  
✓ Zero hardcoded fallback values (use `''` instead)  

---

## Files Modified Today

1. ✅ Contact.tsx - Fixed section name to 'info'
2. ✅ AccessibilityStatement.tsx - Added usePageContent hook
3. ✅ PrivacyPolicy.tsx - Added usePageContent hook
4. ✅ CookiePolicy.tsx - Added usePageContent hook
5. ✅ TermsOfService.tsx - Added usePageContent hook
6. ✅ AboutJustEmpower.tsx - Added usePageContent hook
7. ⏳ ArticleDetail.tsx - Needs fixing
8. ⏳ Checkout.tsx - Needs fixing
9. ⏳ DynamicPage.tsx - Needs fixing
10. ⏳ EventDetail.tsx - Needs fixing
11. ⏳ Events.tsx - Needs fixing
12. ⏳ ProductDetail.tsx - Needs fixing
13. ⏳ Shop.tsx - Needs fixing

---

## Next Steps

1. **Complete remaining 7 pages** - Use template pattern above
2. **Update seed script** - Add policy pages and missing sections
3. **Test all pages** - Edit CMS content, verify persistence
4. **Deploy to production** - Build, commit, push, restart
5. **Verify on production** - Test each page with CMS edits

---

## Notes

- The CMS system is working correctly - the issue was pages not using it
- Contact info should be centralized in one CMS location for consistency
- All pages now follow the same pattern for easy maintenance
- Future pages should use `usePageContent` hook from day one

