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

## Text Styling System

### Overview

The Text Styling System allows per-field font customization (font family, size, color, bold, italic, underline) through the Content Editor. Styles are stored in the `contentTextStyles` table and applied on the frontend via `usePageContent` helpers.

### Database Schema: `contentTextStyles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key |
| `contentId` | int | Foreign key → `siteContent.id` |
| `isBold` | int | 1 = bold, 0 = normal |
| `isItalic` | int | 1 = italic, 0 = normal |
| `isUnderline` | int | 1 = underline, 0 = normal |
| `fontOverride` | varchar | Google Font name (e.g., "Crimson Text") |
| `fontSize` | varchar | CSS size (e.g., "48px", "2rem") |
| `fontColor` | varchar | Hex color (e.g., "#ffffff") |
| `updatedAt` | timestamp | Last modification |

### Admin Interface

The `TextFormatToolbar.tsx` component provides controls for each text field:
- **B** (Bold), **I** (Italic), **U** (Underline) toggle buttons
- Font size dropdown
- Color picker
- Google Font selector

Styles are saved via `trpc.contentTextStyles.save` mutation.

### Frontend Implementation

```typescript
import { usePageContent } from '@/hooks/usePageContent';
import { cn } from '@/lib/utils';

export default function MyPage() {
  const { getContent, getTextStyle, getInlineStyles } = usePageContent('page-slug');
  
  return (
    <h1 
      className={cn(
        "text-4xl font-light",
        getTextStyle('hero', 'title')?.fontOverride ? '' : 'font-serif',
        getTextStyle('hero', 'title')?.fontColor ? '' : 'text-foreground'
      )}
      style={getInlineStyles('hero', 'title')}
    >
      {getContent('hero', 'title')}
    </h1>
  );
}
```

### API Endpoints

| Endpoint | Type | Description |
|----------|------|-------------|
| `content.getTextStylesByPage` | Query | Get all styles for a page (uses SQL JOIN) |
| `contentTextStyles.get` | Query | Get style for single contentId |
| `contentTextStyles.save` | Mutation | Save/update style for contentId |

### Pages with Full Text Styling Support

| Page | Status |
|------|--------|
| `Home.tsx` | ✅ All sections styled via Hero/Section components |
| `Founder.tsx` | ✅ All sections: hero, opening, truth, depth, remembrance, renewal, future |
| `Philosophy.tsx` | ✅ hero, principles, pillars, newsletter |
| `About.tsx` | ✅ All sections styled |
| `Offerings.tsx` | ✅ hero, seeds, sheWrites, emerge, rootedUnity |
| `WalkWithUs.tsx` | ✅ hero, main, partners, individuals, quote, options, content, overview |
| `Contact.tsx` | ✅ hero, info sections |
| `Events.tsx` | ✅ hero section |

### Styling Pattern

For each text element:
1. Use `cn()` for conditional class merging
2. Check if `fontOverride` exists → skip default font class
3. Check if `fontColor` exists → skip default color class
4. Apply `getInlineStyles()` for runtime CSS

```typescript
<p 
  className={cn(
    "text-lg leading-relaxed",
    getTextStyle('section', 'key')?.fontColor ? '' : 'text-muted-foreground'
  )} 
  style={getInlineStyles('section', 'key')}
>
  {content}
</p>
```

### Technical Notes

- **SQL JOIN Query**: `getTextStylesByPage` uses an INNER JOIN between `contentTextStyles` and `siteContent` to avoid JavaScript type mismatch issues
- **Dynamic Font Loading**: `usePageContent` automatically loads Google Fonts when `fontOverride` values are detected
- **Fallback Behavior**: Default Tailwind classes apply when no custom style is set

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

## Page Zones System

### Overview

Page Zones allow Page Builder blocks to be injected into specific locations within existing React pages. This enables hybrid editing where pages maintain their core structure but can have dynamic content blocks added via the admin interface.

### Database Schema: `pageZones`

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Primary key |
| `pageSlug` | varchar(100) | Page identifier (e.g., 'founder', 'home') |
| `zoneName` | varchar(100) | Zone location (e.g., 'after-hero', 'before-footer') |
| `blocks` | longtext | JSON array of Page Builder blocks |
| `isActive` | int | 1 = active, 0 = disabled |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last modification |

### Available Pages and Zones

| Page | Zones |
|------|-------|
| `home` | after-hero, mid-page, after-carousel, before-community, after-community, before-newsletter, before-footer |
| `about` | after-hero, after-opening, after-truth, after-depth, after-remembrance, after-renewal, after-future, before-newsletter, before-footer |
| `founder` | after-hero, after-opening, after-truth, after-depth, after-remembrance, after-renewal, after-future, before-newsletter, before-footer |
| `philosophy` | after-hero, after-pillars, before-newsletter, before-footer |
| `offerings` | after-hero, mid-page, after-content, before-newsletter, before-footer |
| `walk-with-us` | after-hero, mid-page, before-newsletter, before-footer |
| `events` | after-hero, mid-page, before-footer |
| `contact` | after-hero, mid-page, before-footer |
| `blog` | after-hero, after-articles, sidebar, before-footer |
| `resources` | after-hero, mid-page, before-footer |

### Frontend Implementation

```typescript
import { EditablePageZone } from '@/components/PageZone';

export default function MyPage() {
  return (
    <div>
      {/* Hero Section */}
      <section>...</section>
      
      {/* Page Zone: After Hero */}
      <EditablePageZone pageSlug="my-page" zoneName="after-hero" />
      
      {/* More content... */}
      
      {/* Page Zone: Before Footer */}
      <EditablePageZone pageSlug="my-page" zoneName="before-footer" />
    </div>
  );
}
```

### API Endpoints

| Endpoint | Type | Auth | Description |
|----------|------|------|-------------|
| `pageZones.getZone` | Query | Public | Get zone blocks for rendering |
| `pageZones.getPageZones` | Query | Admin | Get all zones for a page |
| `pageZones.upsertZone` | Mutation | Admin | Create/update zone |
| `pageZones.deleteZone` | Mutation | Admin | Delete a zone |
| `pageZones.getAvailablePages` | Query | Admin | List pages with zone support |

### Admin Interface

Access zone editing at `/admin/zones` or directly via `/admin/zone-editor/{pageSlug}/{zoneName}`.

When logged in as admin, hovering over page zones on the live site shows an "Edit Zone" button.

---

## Media Fields System

### Overview

Media fields (images and videos) are stored in the `siteContent` table with contentKey values containing 'imageUrl', 'videoUrl', 'Image', or 'Video'. The Content Editor automatically shows a MediaPicker button for these fields.

### Media Field Naming Convention

| Field Type | ContentKey Pattern | Example |
|------------|-------------------|---------|
| Hero Video | `videoUrl` | `hero.videoUrl` |
| Hero Image | `imageUrl` | `hero.imageUrl` |
| Section Image | `imageUrl` | `philosophy.imageUrl` |
| Option Images | `option{N}_imageUrl` | `options.option1_imageUrl` |

### Pages with Media Fields

| Page | Section | Media Fields |
|------|---------|--------------|
| `home` | hero | videoUrl, imageUrl |
| `home` | philosophy, community, pointsOfAccess | imageUrl |
| `founder` | hero | videoUrl, imageUrl |
| `about` | hero | videoUrl, imageUrl |
| `philosophy` | hero | videoUrl, imageUrl |
| `philosophy` | principles, pillars | imageUrl |
| `offerings` | hero | videoUrl, imageUrl |
| `offerings` | seeds, sheWrites, emerge, rootedUnity | imageUrl |
| `walk-with-us` | hero | videoUrl, imageUrl |
| `walk-with-us` | quote, options | imageUrl |
| `contact` | hero | videoUrl, imageUrl |
| `events` | hero | videoUrl, imageUrl |

### Adding Media Fields via SQL

```sql
INSERT IGNORE INTO siteContent (page, section, contentKey, contentValue) VALUES
('page-slug', 'section-name', 'imageUrl', ''),
('page-slug', 'section-name', 'videoUrl', '');
```

### MediaPicker Component

The Content Editor automatically renders a MediaPicker button for any field where `contentKey` includes:
- `Url`
- `Image`
- `Video`

Located at: `client/src/components/MediaPicker.tsx`

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

## Media Library

### File Structure
```
client/src/pages/
├── AdminMedia.tsx              # Basic media library
└── AdminMediaEnhanced.tsx      # Enhanced media library with conversion

server/
├── mediaConversionService.ts   # FFmpeg conversion logic
└── storage.ts                  # S3 upload/download
```

### Media Conversion

The Media Library supports converting videos and images between formats using FFmpeg.

**Supported Conversions:**
- **Video:** MOV → MP4, WebM | AVI → MP4, WebM | MP4 ↔ WebM
- **Image:** JPEG ↔ PNG ↔ WebP ↔ HEIC ↔ TIFF ↔ BMP
- **Audio:** WAV → MP3, OGG | AIFF → MP3, OGG

**API Endpoints:**
| Endpoint | Type | Description |
|----------|------|-------------|
| `admin.media.getConversionFormats` | Query | Get available output formats |
| `admin.media.convertMedia` | Mutation | Convert file to new format |

**Server Requirements:**
- FFmpeg installed at `/usr/local/bin/ffmpeg`
- Nginx timeout set to 300s for large video conversions

### Nginx Configuration

Location: `/etc/nginx/conf.d/justxempower.conf`

```nginx
location / {
    proxy_pass http://127.0.0.1:8083;
    # ... headers ...
    
    # Extended timeouts for media conversion (5 minutes)
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}
```

---

## Active Pages (with content)

| Page | Entry Count |
|------|-------------|
| `home` | 25 |
| `offerings` | 25 |
| `philosophy` | 21 |
| `walk-with-us` | 16 |
| `founder` | ~15 |
| `contact` | 9 |
| `resources` | 7 |
| `community-events` | 5 |

### Legal Pages (JSON format)
- `privacy-policy`
- `terms-of-service`
- `accessibility`
- `cookie-policy`

---

## Database Connection

**Host:** `justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com`  
**Database:** `justxempower`  
**User:** `justxempower`

### Quick Queries

```sql
-- View all content for a page
SELECT * FROM siteContent WHERE page = 'home' ORDER BY section, contentKey;

-- Count entries per page
SELECT page, COUNT(*) as entries FROM siteContent GROUP BY page ORDER BY entries DESC;

-- Find content with specific text
SELECT page, section, contentKey, LEFT(contentValue, 50) 
FROM siteContent WHERE contentValue LIKE '%search%';

-- Delete unused content (entries without marker)
DELETE FROM siteContent WHERE page = 'page-slug' AND contentValue NOT LIKE '%123%';
```

---

## Additional Scripts

| Script | Purpose |
|--------|---------|
| `scripts/cleanup-unused-content.cjs` | Delete entries without "123" marker |
| `scripts/restore-media-fields.cjs` | Restore imageUrl/videoUrl fields |
| `scripts/update-nginx-timeout.sh` | Update nginx proxy timeouts |

---

**Last Updated:** January 28, 2026
