# Content Editor GM

## Data Flow
```
Content Editor (AdminContent.tsx)
       ↓ writes to
   siteContent table (MySQL)
       ↓ read by
   Frontend Pages (usePageContent hook)
```

## Key Files
- `client/src/pages/AdminContent.tsx` - Editor UI
- `client/src/hooks/usePageContent.ts` - Frontend hook to READ content
- `server/adminRouters.ts` - API routes
- `server/adminDb.ts` - DB functions

## Database: siteContent
| Column | Example |
|--------|---------|
| page | 'home', 'founder' |
| section | 'hero', 'about' |
| contentKey | 'title', 'description' |
| contentValue | actual content |

## CRITICAL RULE
ALL pages MUST use `usePageContent`:
```tsx
const { getSection } = usePageContent('page-slug');
const hero = getSection('hero');
```

NEVER use `usePageSectionContent` - wrong table!

## API Endpoints
- `trpc.admin.content.update` - Save edits
- `trpc.content.getByPage` - Frontend reads

## Troubleshooting
1. Hard refresh (Cmd+Shift+R)
2. Verify page uses `usePageContent`
3. Check DB: `SELECT * FROM siteContent WHERE page='xxx'`

## Audit Results (Jan 2026)
- 202/202 fields tested ✅
- All pages use correct hook ✅
