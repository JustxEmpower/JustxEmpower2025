# Content Editor - Complete System Documentation

## Overview

The Content Editor (`/admin/content`) allows administrators to edit all text, images, and videos across the Just Empower website. Changes reflect immediately on the live site.

---

## File Structure

```
client/src/
├── pages/
│   └── AdminContent.tsx          # Main Content Editor UI (694 lines)
├── hooks/
│   └── usePageContent.ts         # Frontend hook to READ content (228 lines)
├── components/
│   ├── LegalPageEditorNew.tsx    # Editor for legal pages (262 lines)
│   ├── SectionVisualizer.tsx     # Left panel section navigator
│   ├── MediaPicker.tsx           # Image/video selection modal
│   └── TextFormatToolbar.tsx     # Bold/italic/font controls

server/
├── adminRouters.ts               # tRPC API routes for content CRUD
├── adminDb.ts                    # Database operations (Drizzle ORM)

drizzle/
└── schema.ts                     # Database table definitions
```

---

## Database Schema

### `siteContent` Table (PRIMARY)

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key, auto-increment |
| `page` | varchar(100) | Page slug: `home`, `founder`, `philosophy`, etc. |
| `section` | varchar(100) | Section name: `hero`, `opening`, `truth`, etc. |
| `contentKey` | varchar(100) | Field name: `title`, `description`, `paragraph1`, etc. |
| `contentValue` | text | The actual content (text or URL) |
| `updatedAt` | timestamp | Last modification time |

### Content Organization

```
page: "founder"
├── section: "hero"
│   ├── contentKey: "title" → "April Gambardella"
│   ├── contentKey: "subtitle" → "FOUNDER & VISIONARY"
│   └── contentKey: "description" → "A journey of truth..."
├── section: "opening"
│   ├── contentKey: "title" → "The Story"
│   ├── contentKey: "paragraph1" → "There are moments..."
│   └── contentKey: "paragraph2" → "My path has been..."
└── section: "truth"
    ├── contentKey: "title" → "The Truth Behind..."
    └── contentKey: "description" → "Just Empower exists..."
```

---

## Data Flow

### Writing (Admin → Database)

```
AdminContent.tsx
    │
    ├─► handleContentChange() → setEditedContent() [local state]
    │
    └─► handleSaveAll()
        │
        ├─► trpc.admin.content.update.mutateAsync({ id, contentValue })
        │   └─► adminRouters.ts → adminDb.updateSiteContent()
        │
        └─► trpc.admin.content.upsert.mutateAsync({ page, section, contentKey, contentValue })
            └─► adminRouters.ts → adminDb.upsertSiteContent()
```

### Reading (Database → Frontend)

```
Frontend Page (e.g., Founder.tsx)
    │
    └─► usePageContent('founder')
        │
        └─► trpc.content.getByPage.useQuery({ page: 'founder' })
            │
            └─► publicContentRouter → getSiteContentByPage()
                │
                └─► Returns array of { section, contentKey, contentValue }
```

---

## API Endpoints

### Admin Routes (require authentication)

| Endpoint | Type | Input | Description |
|----------|------|-------|-------------|
| `admin.content.getByPage` | Query | `{ page: string }` | Get all content for a page |
| `admin.content.update` | Mutation | `{ id: number, contentValue: string }` | Update by ID |
| `admin.content.upsert` | Mutation | `{ page, section, contentKey, contentValue }` | Create or update |
| `admin.content.listAll` | Query | none | Get all site content |

### Public Routes (no auth)

| Endpoint | Type | Input | Description |
|----------|------|-------|-------------|
| `content.getByPage` | Query | `{ page: string }` | Frontend content fetch |
| `content.getTextStylesByPage` | Query | `{ page: string }` | Get text formatting |

---

## AdminContent.tsx Structure

### State Management

```typescript
// Selected page tab
const [selectedPage, setSelectedPage] = useState('home');

// Content items from database
const [content, setContent] = useState<ContentItem[]>([]);

// Pending edits (not yet saved)
const [editedContent, setEditedContent] = useState<Record<number, string>>({});

// Expanded/collapsed sections
const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

// Legal page sections (special JSON format)
const [legalSections, setLegalSections] = useState<LegalSection[]>([]);
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `handleContentChange(id, value)` | Track field edits locally |
| `handleSaveAll()` | Save all pending changes to database |
| `handleSectionClick(section)` | Navigate to section |
| `toggleSection(section)` | Expand/collapse section |
| `handleMediaSelect(url)` | Insert media URL into field |

### Page Types

1. **Standard Pages** - Display grouped content sections
2. **Legal Pages** - Use `LegalPageEditorNew` component with JSON sections
3. **Page Builder Pages** - Show "PB" badge, link to zone editor

---

## usePageContent Hook

### Usage

```typescript
import { usePageContent } from '@/hooks/usePageContent';

export default function MyPage() {
  const { getContent, getSection, isLoading } = usePageContent('page-slug');
  
  // Get single value
  const title = getContent('hero', 'title', 'Default Title');
  
  // Get entire section as object
  const heroSection = getSection('hero');
  // heroSection = { title: '...', subtitle: '...', description: '...' }
  
  // Get styled content (with formatting)
  const styledTitle = getStyledContent('hero', 'title', 'Default', 'h1', 'text-4xl');
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `content` | `ContentItem[]` | Raw content array |
| `isLoading` | `boolean` | Loading state |
| `getContent(section, key, default)` | `string` | Get single value |
| `getSection(section)` | `Record<string, string>` | Get all keys in section |
| `getTextStyle(section, key)` | `TextStyle` | Get formatting |
| `getStyleClasses(section, key)` | `string` | CSS classes for styling |
| `getInlineStyles(section, key)` | `CSSProperties` | Inline style object |
| `getStyledContent(...)` | `ReactElement` | Pre-styled element |

---

## Legal Pages

Legal pages use a special JSON format stored in `legalSections.sections`:

```json
[
  { "id": "1", "header": "Last Updated", "body": "January 1, 2026" },
  { "id": "2", "header": "Information We Collect", "body": "We collect..." },
  { "id": "3", "header": "How We Use Your Information", "body": "..." }
]
```

### Legal Page Slugs
- `privacy-policy`
- `terms-of-service`
- `accessibility`
- `cookie-policy`

### Rendering
`LegalPageRenderer.tsx` parses the JSON and displays sections with headers and body text.

---

## Adding a New Page

### 1. Add to pageOrder in AdminContent.tsx

```typescript
const pageOrder: Record<string, number> = {
  'home': 1,
  'new-page': 18,  // Add here
  // ...
};
```

### 2. Insert content in database

```sql
INSERT INTO siteContent (page, section, contentKey, contentValue) VALUES
('new-page', 'hero', 'title', 'Page Title'),
('new-page', 'hero', 'subtitle', 'Page Subtitle'),
('new-page', 'hero', 'description', 'Page description text');
```

### 3. Create page component

```typescript
// client/src/pages/NewPage.tsx
import { usePageContent } from '@/hooks/usePageContent';

export default function NewPage() {
  const { getContent, getSection, isLoading } = usePageContent('new-page');
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{getContent('hero', 'title')}</h1>
      <p>{getContent('hero', 'description')}</p>
    </div>
  );
}
```

### 4. Add route in App.tsx

```typescript
<Route path="/new-page">{() => <NewPage />}</Route>
```

---

## Troubleshooting

### Content not appearing on live site

1. **Check hook usage:**
   ```bash
   grep -n "usePageContent" client/src/pages/PageName.tsx
   ```

2. **Verify database content:**
   ```sql
   SELECT * FROM siteContent WHERE page = 'page-slug';
   ```

3. **Check page slug matches:**
   - Database `page` column must match `usePageContent('slug')`

### Duplicate fields in Content Editor

Delete duplicate database entries:
```sql
DELETE t1 FROM siteContent t1
INNER JOIN siteContent t2
WHERE t1.id > t2.id
  AND t1.page = t2.page
  AND t1.section = t2.section
  AND t1.contentKey = t2.contentKey;
```

---

## Maintenance Scripts

| Script | Purpose |
|--------|---------|
| `scripts/insert-legal-content.cjs` | Populate legal page content |
| `scripts/populate-founder.cjs` | Populate founder page content |

Run on server:
```bash
export DATABASE_URL="mysql://..."
node scripts/script-name.cjs
```

---

**Last Updated:** January 27, 2026
