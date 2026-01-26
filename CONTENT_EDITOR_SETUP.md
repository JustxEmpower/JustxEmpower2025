# Content Editor System Documentation

## Overview

The Content Editor allows administrators to edit page content through the admin panel. This document explains how the system works to prevent future issues.

## Architecture

### Data Flow

```
Content Editor (AdminContent.tsx)
        ↓ writes to
    siteContent table (MySQL/RDS)
        ↓ read by
    Frontend Pages (via usePageContent hook)
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AdminContent.tsx` | `client/src/pages/AdminContent.tsx` | Admin UI for editing content |
| `usePageContent` | `client/src/hooks/usePageContent.ts` | Hook for frontend pages to READ content |
| `siteContent` table | MySQL RDS | Stores all page content |
| `adminRouters.ts` | `server/adminRouters.ts` | API routes for content CRUD |
| `adminDb.ts` | `server/adminDb.ts` | Database operations |

## Critical Rules

### ✅ ALL frontend pages MUST use `usePageContent` hook

```typescript
// CORRECT - reads from siteContent table
import { usePageContent } from '@/hooks/usePageContent';

export default function MyPage() {
  const { getContent, getSection, isLoading } = usePageContent('my-page-slug');
  // ...
}
```

### ❌ NEVER use `usePageSectionContent` for editable pages

```typescript
// WRONG - reads from pageSections table (Content Editor doesn't write here!)
import { usePageSectionContent } from '@/hooks/usePageSectionContent';
// This will cause Content Editor edits to NOT appear on the page!
```

## Database Tables

### `siteContent` Table (PRIMARY - used by Content Editor)

| Column | Type | Description |
|--------|------|-------------|
| id | int | Primary key |
| page | varchar | Page slug (e.g., 'home', 'founder') |
| section | varchar | Section name (e.g., 'hero', 'opening') |
| contentKey | varchar | Field name (e.g., 'title', 'description') |
| contentValue | text | The actual content |
| updatedAt | datetime | Last update timestamp |

### `pageSections` Table (LEGACY - do not use for new pages)

This table exists but is NOT connected to the Content Editor. Content stored here cannot be edited via the admin panel.

## Troubleshooting

### "Content Editor edits don't appear on the site"

1. **Check which hook the page uses:**
   ```bash
   grep -n "usePageContent\|usePageSectionContent" client/src/pages/PageName.tsx
   ```

2. **Verify content exists in siteContent:**
   ```sql
   SELECT * FROM siteContent WHERE page = 'page-slug' LIMIT 20;
   ```

3. **Check for recent updates:**
   ```sql
   SELECT * FROM siteContent 
   WHERE updatedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
   ORDER BY updatedAt DESC;
   ```

### Adding a New Page to Content Editor

1. Create content in `siteContent` table:
   ```sql
   INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
   ('new-page', 'hero', 'title', 'Page Title'),
   ('new-page', 'hero', 'description', 'Page description');
   ```

2. Ensure the page component uses `usePageContent`:
   ```typescript
   const { getContent, getSection } = usePageContent('new-page');
   ```

3. Add the page to `pageOrder` in `AdminContent.tsx` for proper tab ordering.

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `trpc.admin.content.getByPage` | Query | Get content for a page |
| `trpc.admin.content.update` | Mutation | Update content by ID |
| `trpc.admin.content.upsert` | Mutation | Create or update content |
| `trpc.content.getByPage` | Query | Public endpoint for frontend |

## Pages Using siteContent (All Editable)

All pages should use `usePageContent` hook:
- Home (`home`)
- Founder (`founder`)
- Philosophy (`philosophy`)
- Offerings (`offerings`)
- About (`about`)
- Contact (`contact`)
- Walk With Us (`walk-with-us`)
- Resources (`resources`)
- Community Events (`community-events`)
- Blog (`blog`)
- Shop (`shop`)
- And all others...

## Maintenance Scripts

Located in `/scripts/`:
- `audit-content.cjs` - Full database audit
- `test-content-flow.cjs` - Test read/write operations

Run with: `node scripts/script-name.cjs`

---

**Last Updated:** January 2026  
**Issue Fixed:** Founder page was using `usePageSectionContent` instead of `usePageContent`, causing Content Editor edits to not appear.
