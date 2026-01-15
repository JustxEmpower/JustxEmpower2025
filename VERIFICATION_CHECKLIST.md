# Verification Checklist - CMS Fixes

## Document 1: CMS_FIX_SUMMARY.md

### Section 1: Pages Now Using CMS (Lines 11-25)
| # | Page | Status in Doc | Needs Verification |
|---|------|---------------|-------------------|
| 1 | About.tsx | ✅ Fixed | Check usePageContent hook |
| 2 | AccessibilityStatement.tsx | ✅ Fixed | Check usePageContent hook |
| 3 | CommunityEvents.tsx | ✅ Already using CMS | Verify |
| 4 | Contact.tsx | ✅ Fixed (reads from 'info' section) | Check section name |
| 5 | CookiePolicy.tsx | ✅ Fixed | Check usePageContent hook |
| 6 | Home.tsx | ✅ Already using CMS | Verify |
| 7 | Journal.tsx | ✅ Already using CMS | Verify |
| 8 | Offerings.tsx | ✅ Already using CMS | Verify |
| 9 | Philosophy.tsx | ✅ Already using CMS | Verify |
| 10 | PrivacyPolicy.tsx | ✅ Fixed | Check usePageContent hook |
| 11 | Resources.tsx | ✅ Already using CMS | Verify |
| 12 | TermsOfService.tsx | ✅ Fixed | Check usePageContent hook |
| 13 | WalkWithUs.tsx | ✅ Already using CMS | Verify |
| 14 | AboutJustEmpower.tsx | ✅ Fixed | Check usePageContent hook |

### Section 2: Pages WITHOUT CMS - Still Hardcoded (Lines 29-42)
| # | Page | Type | Priority | Action Required |
|---|------|------|----------|-----------------|
| 1 | ArticleDetail.tsx | Blog | MEDIUM | Add CMS for hero/metadata |
| 2 | Checkout.tsx | E-commerce | MEDIUM | Add CMS for labels |
| 3 | DynamicPage.tsx | Utility | LOW | Add CMS support |
| 4 | EventDetail.tsx | Events | MEDIUM | Add CMS for metadata |
| 5 | Events.tsx | Events | MEDIUM | Add CMS for listings |
| 6 | ProductDetail.tsx | E-commerce | MEDIUM | Add CMS for metadata |
| 7 | Shop.tsx | E-commerce | MEDIUM | Add CMS for labels |

### Section 3: Root Cause Analysis (Lines 46-71)
| Problem | Description | Fix Required |
|---------|-------------|--------------|
| Problem 1 | Inconsistent CMS Integration Pattern | Use usePageContent everywhere |
| Problem 2 | Hardcoded Fallback Values | Use empty string '' instead |
| Problem 3 | Contact Info Scattered | Centralize in 'contact' page |

### Section 4: Implementation Checklist (Lines 97-129)
#### Phase 1: Fix Remaining Pages
- [ ] ArticleDetail.tsx - Add CMS for hero/metadata
- [ ] Checkout.tsx - Add CMS for labels
- [ ] DynamicPage.tsx - Add CMS support
- [ ] EventDetail.tsx - Add CMS for metadata
- [ ] Events.tsx - Add CMS for listings
- [ ] ProductDetail.tsx - Add CMS for metadata
- [ ] Shop.tsx - Add CMS for labels

#### Phase 2: Standardize CMS Pattern
- [ ] Remove all trpc.content.getByPage calls
- [ ] Use usePageContent hook everywhere
- [ ] Minimize hardcoded fallback values
- [ ] Use empty string '' instead of full text fallbacks

#### Phase 3: Centralize Contact Information
- [ ] Create 'contact' page in CMS seed script
- [ ] Add sections: email, location, phone, social
- [ ] Update all 5 pages to read from 'contact' page
- [ ] Remove hardcoded contact info from components

#### Phase 4: Seed Data Completeness
- [ ] Add policy pages to seed script
- [ ] Add missing sections for all pages
- [ ] Verify all pages have CMS entries

#### Phase 5: Testing & Verification
- [ ] Edit each page content in admin panel
- [ ] Verify changes appear on frontend
- [ ] Test across all pages
- [ ] Verify CMS persists after page reload

### Section 5: Success Criteria (Lines 196-203)
- [ ] All 23 pages use CMS (usePageContent hook)
- [ ] No hardcoded content in components
- [ ] CMS edits persist across page reloads
- [ ] Contact info centralized in one CMS location
- [ ] All policy pages editable through admin panel
- [ ] Zero hardcoded fallback values (use '' instead)

---

## Document 2: CONTENT_SYNC_AUDIT_REPORT.md

### Page Completion Status (Lines 12-31)
| Page | Sections | Fields | Filled | Empty | Completion | Status |
|------|----------|--------|--------|-------|------------|--------|
| home | 8 | 68 | 66 | 2 | 97% | PARTIAL |
| philosophy | 5 | 28 | 28 | 0 | 100% | COMPLETE |
| founder | 8 | 51 | 51 | 0 | 100% | COMPLETE |
| vision-ethos | 5 | 18 | 17 | 1 | 94% | PARTIAL |
| offerings | 7 | 38 | 38 | 0 | 100% | COMPLETE |
| workshops-programs | 3 | 16 | 15 | 1 | 94% | PARTIAL |
| vix-journal-trilogy | 3 | 16 | 15 | 1 | 94% | PARTIAL |
| blog | 2 | 8 | 8 | 0 | 100% | COMPLETE |
| community-events | 2 | 8 | 8 | 0 | 100% | COMPLETE |
| resources | 2 | 8 | 8 | 0 | 100% | COMPLETE |
| walk-with-us | 8 | 29 | 29 | 0 | 100% | COMPLETE |
| contact | 2 | 14 | 14 | 0 | 100% | COMPLETE |
| about | 8 | 32 | 32 | 0 | 100% | COMPLETE |
| accessibility | 6 | 14 | 14 | 0 | 100% | COMPLETE |
| privacy-policy | 8 | 18 | 18 | 0 | 100% | COMPLETE |
| terms-of-service | 9 | 20 | 20 | 0 | 100% | COMPLETE |
| cookie-policy | 9 | 20 | 20 | 0 | 100% | COMPLETE |
| journal | 1 | 5 | 4 | 1 | 80% | PARTIAL |

### Missing Critical Fields (Lines 33-50)
| Page | Missing Field | Priority |
|------|---------------|----------|
| Home | hero.imageUrl | HIGH |
| Home | offeringsCarousel.item6_link | MEDIUM |
| Vision & Ethos | hero.videoUrl | LOW (optional) |
| Workshops & Programs | hero.videoUrl | LOW (optional) |
| Journal | hero.imageUrl | HIGH |

### Pages Using Database Content Hooks (Lines 63-77)
| Page | Hook Used | Verified |
|------|-----------|----------|
| Home | usePageContent | [ ] |
| Philosophy | usePageContent | [ ] |
| Founder | usePageSectionContent | [ ] |
| About | usePageContent | [ ] |
| AboutJustEmpower | usePageContent | [ ] |
| Offerings | usePageContent | [ ] |
| WalkWithUs | usePageContent | [ ] |
| Contact | usePageContent | [ ] |
| Resources | usePageContent | [ ] |
| Journal | usePageContent | [ ] |
| CommunityEvents | usePageContent | [ ] |
| AccessibilityStatement | usePageContent | [ ] |
| PrivacyPolicy | usePageContent | [ ] |
| TermsOfService | usePageContent | [ ] |
| CookiePolicy | usePageContent | [ ] |

### Recommendations (Lines 85-89)
- [ ] Fill missing hero images for Home and Journal pages
- [ ] Add video URLs to Vision & Ethos and Workshops pages (if video backgrounds desired)
- [ ] Complete carousel links on Home page
