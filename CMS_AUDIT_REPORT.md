# CMS vs Hardcoded Content Audit Report
**Date:** January 4, 2026  
**Status:** CRITICAL - Multiple pages have hardcoded content overriding CMS

---

## Executive Summary

The codebase has a **critical issue**: many pages are hardcoded and do NOT use the CMS system. This means:
- User edits in the admin panel are ignored
- Content cannot be updated without code changes
- Pages with CMS integration still have fallback hardcoded values that override CMS data

---

## Pages Using CMS (✓ Good)
These pages properly use `usePageContent` hook:

| Page | getContent Calls | Status |
|------|-----------------|--------|
| About.tsx | 33 | ✓ Good |
| CommunityEvents.tsx | 5 | ✓ Good |
| Contact.tsx | 11 | ✓ Partially fixed (still has fallback values) |
| Home.tsx | 1 | ✓ Minimal usage |
| Journal.tsx | 10 | ✓ Good |
| Offerings.tsx | 22 | ✓ Good |
| Philosophy.tsx | 20 | ✓ Good |
| Resources.tsx | 5 | ✓ Good |
| WalkWithUs.tsx | 17 | ✓ Good |

---

## Pages WITHOUT CMS (✗ Critical Issue)
These pages are completely hardcoded:

| Page | Issue | Priority |
|------|-------|----------|
| AboutJustEmpower.tsx | No CMS usage | HIGH |
| AccessibilityStatement.tsx | No CMS + contact info hardcoded | HIGH |
| ArticleDetail.tsx | No CMS usage | MEDIUM |
| Checkout.tsx | No CMS usage | MEDIUM |
| ComponentShowcase.tsx | Demo page - OK to skip | LOW |
| CookiePolicy.tsx | No CMS + contact info hardcoded | HIGH |
| DynamicPage.tsx | No CMS usage | MEDIUM |
| EventDetail.tsx | No CMS usage | MEDIUM |
| Events.tsx | No CMS usage | MEDIUM |
| NotFound.tsx | Error page - OK | LOW |
| PageBuilderPage.tsx | Admin page - OK | LOW |
| PrivacyPolicy.tsx | No CMS + contact info hardcoded | HIGH |
| ProductDetail.tsx | No CMS usage | MEDIUM |
| Shop.tsx | No CMS usage | MEDIUM |
| TermsOfService.tsx | No CMS + contact info hardcoded | HIGH |

---

## Hardcoded Content Issues

### Contact Information (Found in Multiple Pages)
- **Email:** `connect@justxempower.com` (hardcoded in Contact.tsx, AccessibilityStatement.tsx, CookiePolicy.tsx, PrivacyPolicy.tsx, TermsOfService.tsx)
- **Location:** `Austin, Texas` (hardcoded in Contact.tsx and policy pages)
- **Social:** Instagram/LinkedIn links (hardcoded in Contact.tsx)

### Policy Pages (AccessibilityStatement, CookiePolicy, PrivacyPolicy, TermsOfService)
- All contain hardcoded contact information
- No CMS integration
- Changes require code edits

### Pages with Fallback Hardcoded Values
Even pages using CMS have fallback values that override CMS data:
```tsx
const heroTitle = getContent('hero', 'title') || 'Connect';  // ← Fallback overrides CMS
const contactEmail = getContent('contact', 'email') || 'connect@justxempower.com';  // ← Hardcoded fallback
```

---

## Root Cause Analysis

1. **Incomplete CMS Migration:** Pages were partially migrated to CMS but still have hardcoded fallbacks
2. **No Fallback Strategy:** Fallback values should be minimal (e.g., "Untitled") not full content
3. **Policy Pages Skipped:** Legal pages were never integrated with CMS
4. **Contact Info Scattered:** Same contact info repeated across multiple files instead of centralized

---

## Recommended Fixes

### Phase 1: Centralize Contact Information
Create a `contactInfo` page in CMS with fields:
- email
- location
- phone
- instagram_url
- linkedin_url
- address

### Phase 2: Migrate Policy Pages to CMS
- AccessibilityStatement
- CookiePolicy
- PrivacyPolicy
- TermsOfService

### Phase 3: Remove Hardcoded Fallbacks
Replace all hardcoded fallback values with minimal defaults:
```tsx
// BEFORE (BAD)
const title = getContent('hero', 'title') || 'Connect';

// AFTER (GOOD)
const title = getContent('hero', 'title') || 'Untitled';
```

### Phase 4: Audit Remaining Pages
- ArticleDetail.tsx
- EventDetail.tsx
- ProductDetail.tsx
- Shop.tsx
- Checkout.tsx

---

## Implementation Priority

**CRITICAL (Do First):**
1. Fix Contact.tsx to use CMS-only (remove fallbacks)
2. Centralize contact info in CMS
3. Update all pages referencing contact info

**HIGH (Do Second):**
1. Migrate policy pages to CMS
2. Remove hardcoded content from AccessibilityStatement, CookiePolicy, PrivacyPolicy, TermsOfService

**MEDIUM (Do Third):**
1. Audit and fix remaining pages
2. Remove all hardcoded fallback values

---

## Testing Plan

After fixes:
1. Edit contact email in CMS
2. Verify it updates on Contact page AND policy pages
3. Edit policy page content in CMS
4. Verify it persists on page reload
5. Check all pages load without errors

---

## Files to Modify

### Immediate (Contact & Info)
- `/client/src/pages/Contact.tsx` - Remove fallbacks, use CMS only
- `/client/src/pages/AccessibilityStatement.tsx` - Add CMS integration
- `/client/src/pages/CookiePolicy.tsx` - Add CMS integration
- `/client/src/pages/PrivacyPolicy.tsx` - Add CMS integration
- `/client/src/pages/TermsOfService.tsx` - Add CMS integration

### Database
- Add new CMS page entries for contact info and policies
- Seed data with current hardcoded values

---

## Success Criteria

✓ All pages use CMS as primary data source  
✓ No hardcoded content in page components  
✓ CMS edits persist across page reloads  
✓ All pages load without errors  
✓ Contact info updates in one place, reflects everywhere  
✓ Policy pages editable through admin panel  

