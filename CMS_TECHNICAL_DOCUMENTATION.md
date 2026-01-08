# Just Empower CMS Technical Documentation

**Version:** 1.0  
**Last Updated:** January 8, 2026  
**Author:** Manus AI

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Page Builder System](#3-page-builder-system)
4. [Block System and JE Blocks](#4-block-system-and-je-blocks)
5. [Content Editor and Section Visualizer](#5-content-editor-and-section-visualizer)
6. [Pages Manager](#6-pages-manager)
7. [Database Schema (RDS)](#7-database-schema-rds)
8. [API Routes and Backend Services](#8-api-routes-and-backend-services)
9. [Auto-Save and Saving Mechanisms](#9-auto-save-and-saving-mechanisms)
10. [How Components Work Together](#10-how-components-work-together)
11. [Known Issues and Problem Areas](#11-known-issues-and-problem-areas)
12. [Code File Reference](#12-code-file-reference)

---

## 1. Executive Summary

The Just Empower CMS is a comprehensive content management system built with React, TypeScript, tRPC, and Drizzle ORM. It provides administrators with multiple ways to manage website content through three primary interfaces: the **Page Builder** (visual drag-and-drop editor), the **Content Editor** (field-based content management), and the **Pages Manager** (page structure management). All content is stored in a MySQL database hosted on Amazon RDS and synchronized between these systems.

The architecture follows a modular design where the Page Builder creates and manages visual blocks, the Content Editor provides granular field-level editing, and the Pages Manager handles page creation, ordering, and navigation settings. These three systems share a common database schema and communicate through tRPC API endpoints.

---

## 2. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ADMIN DASHBOARD                                │
├───────────────────┬───────────────────┬─────────────────────────────────┤
│   Page Builder    │  Content Editor   │      Pages Manager              │
│   (Visual DnD)    │  (Field-based)    │   (Page Structure)              │
├───────────────────┴───────────────────┴─────────────────────────────────┤
│                         tRPC API Layer                                   │
│              (adminRouters.ts, routers.ts)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                      Database Operations                                 │
│                  (adminDb.ts, db.ts)                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                    MySQL Database (RDS)                                  │
│    ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐             │
│    │  pages   │  │pageBlocks│  │siteContent│  │  media   │             │
│    └──────────┘  └──────────┘  └───────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC WEBSITE                                   │
│   ┌──────────────────┐    ┌──────────────────┐                          │
│   │   DynamicPage    │    │   Static Pages   │                          │
│   │  (Block Render)  │    │  (Home, About)   │                          │
│   └──────────────────┘    └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, TailwindCSS, Framer Motion |
| State Management | Zustand (Page Builder), React Query (tRPC) |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Backend | Node.js, Express, tRPC |
| Database | MySQL (Amazon RDS), Drizzle ORM |
| File Storage | Amazon S3 |
| Authentication | Custom admin sessions (database-backed) |

---

## 3. Page Builder System

### Overview

The Page Builder is a visual drag-and-drop editor that allows administrators to create and edit pages using pre-built blocks. It provides a WYSIWYG experience with real-time preview, undo/redo functionality, and auto-save capabilities.

### Core Components

#### 3.1 PageBuilder.tsx (Main Component)

**Location:** `/client/src/components/page-builder/PageBuilder.tsx`

This is the main orchestrator component that renders the entire Page Builder interface. It manages:

- **Header toolbar** with viewport controls, undo/redo, preview toggle, and save button
- **Left panel** containing Block Library, Layers Panel, and Page Library tabs
- **Canvas** where blocks are rendered and can be manipulated
- **Right panel** for block settings and configuration
- **Save dialog** for page metadata (title, slug, publish status)
- **Auto-save recovery** for unsaved work

Key state managed:
```typescript
// From usePageBuilderStore
const {
  blocks,           // Array of PageBlock objects
  selectedBlockId,  // Currently selected block
  isPreviewMode,    // Preview vs edit mode
  isSaving,         // Save operation in progress
  hasUnsavedChanges // Dirty state tracking
} = usePageBuilderStore();
```

#### 3.2 usePageBuilderStore.ts (State Management)

**Location:** `/client/src/components/page-builder/usePageBuilderStore.ts`

This Zustand store manages all Page Builder state including:

```typescript
interface PageBuilderState {
  // Page data
  pageId: string | null;
  pageTitle: string;
  blocks: PageBlock[];
  
  // UI state
  selectedBlockId: string | null;
  hoveredBlockId: string | null;
  isDragging: boolean;
  isPreviewMode: boolean;
  isSaving: boolean;
  
  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;
  
  // Auto-save state
  lastAutoSave: number | null;
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
}
```

**Key Actions:**
- `addBlock(blockType, index)` - Adds a new block at specified position
- `updateBlock(id, content)` - Updates block content
- `deleteBlock(id)` - Removes a block
- `moveBlock(fromIndex, toIndex)` - Reorders blocks
- `undo()` / `redo()` - History navigation
- `autoSave()` - Saves to localStorage

#### 3.3 Canvas.tsx (Block Rendering Area)

**Location:** `/client/src/components/page-builder/Canvas.tsx`

The Canvas component renders all blocks in a sortable context using @dnd-kit. It handles:

- Drag and drop reordering of existing blocks
- Dropping new blocks from the Block Library
- Block selection and hover states
- Preview mode rendering (no editing controls)

```typescript
// SortableBlock renders each block with controls
function SortableBlock({ block, isSelected, isHovered, ... }) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id: block.id });
  
  return (
    <motion.div ref={setNodeRef} style={style}>
      {/* Block toolbar with drag handle, duplicate, delete */}
      <BlockRenderer block={block} />
    </motion.div>
  );
}
```

#### 3.4 BlockSettings.tsx (Right Panel)

**Location:** `/client/src/components/page-builder/panels/BlockSettings.tsx`

This panel dynamically renders form fields based on the selected block's content schema. It supports:

- Text inputs for strings
- Number inputs for numeric values
- Switches for boolean values
- Textareas for long content
- MediaPicker integration for images/videos
- Select dropdowns for enums (alignment, variants)
- Nested object editors (buttons, features arrays)

```typescript
// Field rendering based on content type
function renderField(key, value, onChange, blockType) {
  if (typeof value === 'boolean') return <Switch ... />;
  if (typeof value === 'number') return <Input type="number" ... />;
  if (key.includes('image') || key.includes('video')) {
    return <MediaFieldWithPicker ... />;
  }
  // ... more field types
}
```

---

## 4. Block System and JE Blocks

### Block Type Definition

**Location:** `/client/src/components/page-builder/blockTypes.ts`

Each block type is defined with:

```typescript
interface BlockType {
  id: string;              // Unique identifier (e.g., 'je-hero-video')
  name: string;            // Display name
  description: string;     // Short description
  icon: LucideIcon;        // Icon component
  category: BlockCategory; // Category for grouping
  defaultContent: Record<string, unknown>; // Default values
  isJustEmpower?: boolean; // JE-specific block flag
}
```

### Block Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `je-hero` | JustEmpower hero sections | JE Hero Video, JE Hero Image, JE Hero Split |
| `je-content` | JE content blocks | JE Section Standard, JE Pillars, JE Principles |
| `je-media` | JE media blocks | JE Image, JE Video, JE Gallery |
| `je-interactive` | JE interactive elements | JE FAQ, JE Contact Form, JE Newsletter |
| `layout` | Generic layout blocks | Container, Columns, Spacer |
| `content` | Generic content blocks | Heading, Text, Quote |
| `media` | Generic media blocks | Image, Video, Gallery |

### JE Block Renderers

**Location:** `/client/src/components/page-builder/renderers/JEBlockRenderers.tsx`

The JE Block Renderers provide custom rendering for Just Empower branded blocks. Each renderer handles:

1. **Content extraction** from block.content
2. **Media URL resolution** using `getMediaUrl()`
3. **Responsive styling** with Tailwind classes
4. **Animation effects** using Framer Motion
5. **Error handling** for missing content

#### JEHeroRenderer (Key Example)

```typescript
export function JEHeroRenderer({ block }: { block: PageBlock }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const content = block.content as {
    videoUrl?: string;
    imageUrl?: string;
    posterImage?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    overlayOpacity?: number;
  };

  // URL resolution
  const videoUrl = content.videoUrl ? getMediaUrl(content.videoUrl) : undefined;
  const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

  // Video playback handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.load();
    
    return () => { /* cleanup */ };
  }, [videoUrl]);

  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* Video Background */}
      {videoUrl && !videoError && (
        <video ref={videoRef} autoPlay muted loop playsInline>
          <source src={videoUrl} type="video/mp4" />
        </video>
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />
      {/* Content */}
      <div className="relative z-10 text-white">
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        {content.ctaText && <Link href={content.ctaLink}>{content.ctaText}</Link>}
      </div>
    </section>
  );
}
```

### Block Rendering Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BlockRenderer.tsx                             │
│  (Main dispatcher - determines which renderer to use)           │
├─────────────────────────────────────────────────────────────────┤
│  switch(block.type) {                                           │
│    case 'je-hero-video':                                        │
│    case 'je-hero-image':                                        │
│    case 'je-hero-split':                                        │
│      return <JEHeroRenderer block={block} />;                   │
│                                                                  │
│    case 'je-section-standard':                                  │
│    case 'je-section-fullwidth':                                 │
│      return <JESectionRenderer block={block} />;                │
│                                                                  │
│    case 'hero':                                                 │
│      return <HeroBlock content={block.content} />;              │
│                                                                  │
│    // ... more cases                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### How Blocks Should Always Render

To ensure blocks always render correctly:

1. **Default Content:** Every block type must have `defaultContent` defined in `blockTypes.ts`
2. **Null Checks:** Renderers must handle undefined/null values gracefully
3. **Fallback UI:** Show placeholder content when media is missing
4. **Error Boundaries:** Catch rendering errors to prevent page crashes
5. **Media URL Resolution:** Always use `getMediaUrl()` for S3 URLs

```typescript
// Example of defensive rendering
const imageUrl = content.imageUrl ? getMediaUrl(content.imageUrl) : undefined;

return (
  <div>
    {imageUrl ? (
      <img src={imageUrl} alt={content.alt || ''} />
    ) : (
      <div className="placeholder">Add an image in settings</div>
    )}
  </div>
);
```

---

## 5. Content Editor and Section Visualizer

### Content Editor (AdminContent.tsx)

**Location:** `/client/src/pages/AdminContent.tsx`

The Content Editor provides field-level editing of page content stored in the `siteContent` table. Unlike the Page Builder which manages blocks, the Content Editor manages key-value pairs organized by page and section.

#### Key Features

1. **Page Selection:** Dropdown to select which page to edit
2. **Section Grouping:** Content organized by sections (hero, main, newsletter, etc.)
3. **Field Editing:** Individual fields with appropriate input types
4. **Media Integration:** MediaPicker for image/video fields
5. **Text Formatting:** Bold, italic, underline controls
6. **Auto-expand:** All sections expanded by default

#### Data Structure

```typescript
interface ContentItem {
  id: number;
  page: string;      // 'home', 'about', 'philosophy'
  section: string;   // 'hero', 'main', 'newsletter'
  contentKey: string; // 'title', 'description', 'imageUrl'
  contentValue: string;
}
```

#### Save Flow

```typescript
const handleSaveAll = async () => {
  const updates = Object.entries(editedContent);
  for (const [id, value] of updates) {
    await updateMutation.mutateAsync({
      id: parseInt(id),
      contentValue: value,
    });
  }
  toast.success('All changes saved!');
};
```

### Section Visualizer (SectionVisualizer.tsx)

**Location:** `/client/src/components/SectionVisualizer.tsx`

The Section Visualizer provides a visual overview of page structure and content completion status. It displays:

1. **Page Structure:** Visual representation of all sections
2. **Completion Percentage:** Per-section and overall completion
3. **Section Types:** Color-coded by type (hero, content, newsletter, etc.)
4. **Active Section Indicator:** Shows which section is being edited
5. **Traffic Light Status:** Red/Yellow/Green completion indicator

#### Section Type Styling

```typescript
const sectionTypeStyles = {
  hero: { borderColor: 'border-red-400', bgColor: 'bg-red-50' },
  content: { borderColor: 'border-orange-400', bgColor: 'bg-orange-50' },
  newsletter: { borderColor: 'border-cyan-400', bgColor: 'bg-cyan-50' },
  footer: { borderColor: 'border-gray-400', bgColor: 'bg-gray-50' },
  // ... more types
};
```

---

## 6. Pages Manager

### Overview (AdminPages.tsx)

**Location:** `/client/src/pages/AdminPages.tsx`

The Pages Manager handles page-level operations including creation, editing, deletion, and ordering. It provides:

1. **Page List:** Sortable list of all pages with drag-and-drop reordering
2. **Page Creation:** Dialog for creating new pages with title, slug, SEO settings
3. **Page Editing:** Modify page metadata and settings
4. **Navigation Control:** Toggle "Show in Nav" for each page
5. **Publish Status:** Draft vs Published status management
6. **Parent/Child Pages:** Support for sub-pages and dropdown menus

### Page Data Structure

```typescript
interface Page {
  id: number;
  title: string;
  slug: string;
  template: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  published: number;      // 0 = draft, 1 = published
  showInNav: number;      // 0 = hidden, 1 = visible
  navOrder: number | null;
  parentId: number | null; // For sub-pages
  createdAt: Date;
  updatedAt: Date;
}
```

### Page Creation Flow

When a new page is created:

1. **Insert into `pages` table** with title, slug, and settings
2. **Create default `siteContent` entries** for hero, main, newsletter sections
3. **Add SEO settings** entry in `seoSettings` table
4. **Page becomes available** in Content Editor and Page Builder

```typescript
// From adminDb.ts
export async function createPage(data) {
  const [result] = await db.insert(pages).values(data);
  const pageId = result.insertId;
  
  // Auto-create default siteContent sections
  const defaultSections = [
    { section: 'hero', contentKey: 'title', contentValue: data.title },
    { section: 'hero', contentKey: 'subtitle', contentValue: '' },
    // ... more default fields
  ];
  
  for (const section of defaultSections) {
    await db.insert(siteContent).values({
      page: data.slug,
      section: section.section,
      contentKey: section.contentKey,
      contentValue: section.contentValue,
    });
  }
  
  return { id: pageId };
}
```

---

## 7. Database Schema (RDS)

### Core Tables

**Location:** `/drizzle/schema.ts`

#### pages Table

```typescript
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  template: varchar("template", { length: 100 }).default("default"),
  metaTitle: varchar("metaTitle", { length: 255 }),
  metaDescription: text("metaDescription"),
  ogImage: varchar("ogImage", { length: 1000 }),
  published: int("published").default(1).notNull(),
  showInNav: int("showInNav").default(1).notNull(),
  navOrder: int("navOrder").default(0),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### pageBlocks Table

```typescript
export const pageBlocks = mysqlTable("pageBlocks", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  content: text("content"),      // JSON string
  order: int("order").notNull().default(0),
  settings: text("settings"),    // JSON string
  visibility: text("visibility"), // JSON string
  animation: text("animation"),   // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### siteContent Table

```typescript
export const siteContent = mysqlTable("siteContent", {
  id: int("id").autoincrement().primaryKey(),
  page: varchar("page", { length: 100 }).notNull(),
  section: varchar("section", { length: 100 }).notNull(),
  contentKey: varchar("contentKey", { length: 100 }).notNull(),
  contentValue: text("contentValue").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### media Table

```typescript
export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 1000 }),
  type: mysqlEnum("type", ["image", "video"]).notNull(),
  uploadedBy: varchar("uploadedBy", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

### Table Relationships

```
┌──────────────┐     ┌──────────────┐
│    pages     │────<│  pageBlocks  │
│              │     │              │
│ id (PK)      │     │ pageId (FK)  │
│ title        │     │ type         │
│ slug         │     │ content      │
│ published    │     │ order        │
└──────────────┘     └──────────────┘
       │
       │ slug
       ▼
┌──────────────┐
│ siteContent  │
│              │
│ page (slug)  │
│ section      │
│ contentKey   │
│ contentValue │
└──────────────┘
```

---

## 8. API Routes and Backend Services

### Admin Router (adminRouters.ts)

**Location:** `/server/adminRouters.ts`

The admin router provides all authenticated endpoints for the CMS. Key route groups:

#### Pages Routes

```typescript
pages: router({
  list: adminProcedure.query(async () => {
    return await getAllPages();
  }),
  
  getBySlug: adminProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await getPageBySlug(input.slug);
    }),
  
  create: adminProcedure
    .input(z.object({
      title: z.string(),
      slug: z.string(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      published: z.number().default(1),
      showInNav: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      return await createPage(input);
    }),
  
  // ... update, delete, reorder
})
```

#### Blocks Routes

```typescript
blocks: router({
  getByPage: adminProcedure
    .input(z.object({ pageId: z.number() }))
    .query(async ({ input }) => {
      return await getPageBlocks(input.pageId);
    }),
  
  create: adminProcedure
    .input(z.object({
      pageId: z.number(),
      type: z.string(),
      content: z.string(),
      order: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await createPageBlock(input);
    }),
  
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      content: z.string().optional(),
      order: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await updatePageBlock(input.id, input);
      // Sync to siteContent for Content Editor access
      await syncPageBlocksToSiteContent(pageId, pageSlug);
    }),
})
```

### Database Operations (adminDb.ts)

**Location:** `/server/adminDb.ts`

Key functions for page and block management:

```typescript
// Get all blocks for a page (with JSON parsing)
export async function getPageBlocks(pageId: number): Promise<ParsedPageBlock[]> {
  const blocks = await db
    .select()
    .from(pageBlocks)
    .where(eq(pageBlocks.pageId, pageId))
    .orderBy(pageBlocks.order);
  
  return blocks.map(block => ({
    ...block,
    content: block.content ? JSON.parse(block.content) : {},
    settings: block.settings ? JSON.parse(block.settings) : {},
    animation: block.animation ? JSON.parse(block.animation) : {},
    visibility: block.visibility ? JSON.parse(block.visibility) : {},
  }));
}

// Sync Page Builder blocks to siteContent for Content Editor
export async function syncPageBlocksToSiteContent(pageId: number, pageSlug: string) {
  const blocks = await getPageBlocks(pageId);
  
  // Delete existing siteContent for this page
  await db.delete(siteContent).where(eq(siteContent.page, pageSlug));
  
  // Create siteContent entries for each block's content fields
  for (const block of blocks) {
    const sectionName = `${block.type}-${block.order}`;
    const textFields = ['title', 'subtitle', 'description', 'ctaText', 'ctaLink', ...];
    
    for (const field of textFields) {
      if (block.content[field]) {
        await db.insert(siteContent).values({
          page: pageSlug,
          section: sectionName,
          contentKey: field,
          contentValue: String(block.content[field]),
        });
      }
    }
  }
}
```

---

## 9. Auto-Save and Saving Mechanisms

### Page Builder Auto-Save

The Page Builder implements a multi-layer saving strategy:

#### 1. LocalStorage Auto-Save

```typescript
// From usePageBuilderStore.ts
autoSave: () => {
  const { pageId, pageTitle, blocks, autoSaveEnabled, lastAutoSave } = get();
  
  if (!autoSaveEnabled) return;
  
  // Debounce: minimum 5 seconds between saves
  const now = Date.now();
  if (lastAutoSave && now - lastAutoSave < 5000) {
    setTimeout(() => get().autoSave(), 5000);
    return;
  }
  
  const autoSaveData = { pageId, pageTitle, blocks, timestamp: now };
  const key = pageId ? `pagebuilder_autosave_${pageId}` : 'pagebuilder_autosave_new';
  localStorage.setItem(key, JSON.stringify(autoSaveData));
  set({ lastAutoSave: now });
}
```

#### 2. Periodic Auto-Save (30 seconds)

```typescript
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = usePageBuilderStore.getState();
    if (state.hasUnsavedChanges && state.autoSaveEnabled) {
      state.autoSave();
    }
  }, 30000); // 30 seconds
}
```

#### 3. Before Unload Save

```typescript
window.addEventListener('beforeunload', (e) => {
  const state = usePageBuilderStore.getState();
  if (state.hasUnsavedChanges) {
    state.autoSave();
    e.preventDefault();
    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
  }
});
```

#### 4. Manual Save (Database)

```typescript
// From PageBuilder.tsx
const handleSaveConfirm = async () => {
  setSaving(true);
  
  // Create or update page
  const pageResult = pageId
    ? await updatePageMutation.mutateAsync({ id: pageId, ... })
    : await createPageMutation.mutateAsync({ ... });
  
  // Save all blocks
  for (const block of blocks) {
    await createBlockMutation.mutateAsync({
      pageId: pageResult.id,
      type: block.type,
      content: JSON.stringify(block.content),
      order: block.order,
    });
  }
  
  // Clear auto-save after successful save
  clearAutoSave();
  markAsSaved();
  toast.success('Page saved successfully!');
};
```

### Auto-Save Recovery

When the Page Builder loads, it checks for unsaved work:

```typescript
useEffect(() => {
  const autoSaveData = loadAutoSave();
  if (autoSaveData && autoSaveData.blocks.length > 0) {
    setShowRecoveryDialog(true);
    setPendingRecovery(autoSaveData);
  }
}, []);

// Recovery dialog offers: Recover or Discard
const handleRecover = () => {
  setBlocks(pendingRecovery.blocks, true);
  setPageTitle(pendingRecovery.pageTitle);
  setShowRecoveryDialog(false);
};
```

---

## 10. How Components Work Together

### Content Flow: Admin to Live Site

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Pages Manager                                                        │
│     └─> Creates page record in `pages` table                            │
│     └─> Creates default `siteContent` entries                           │
│                                                                          │
│  2. Page Builder                                                         │
│     └─> Creates/updates `pageBlocks` records                            │
│     └─> Syncs to `siteContent` for Content Editor                       │
│                                                                          │
│  3. Content Editor                                                       │
│     └─> Updates `siteContent` records directly                          │
│     └─> Can sync back to `pageBlocks` if needed                         │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                         PUBLIC SITE                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  DynamicPage.tsx (for Page Builder pages)                               │
│     └─> Fetches page by slug from `pages`                               │
│     └─> Fetches blocks from `pageBlocks`                                │
│     └─> Renders blocks using BlockRenderer                              │
│                                                                          │
│  Static Pages (Home.tsx, About.tsx, etc.)                               │
│     └─> Fetches content from `siteContent` by page/section              │
│     └─> Renders using hardcoded component structure                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Synchronization Between Systems

The `syncPageBlocksToSiteContent` function bridges Page Builder and Content Editor:

```typescript
// When blocks are saved in Page Builder:
await updatePageBlock(blockId, { content: JSON.stringify(newContent) });
await syncPageBlocksToSiteContent(pageId, pageSlug);

// This creates siteContent entries like:
// page: 'about', section: 'je-hero-video-0', contentKey: 'title', contentValue: 'Welcome'
// page: 'about', section: 'je-hero-video-0', contentKey: 'videoUrl', contentValue: 'https://...'
```

### Media URL Resolution

All media URLs are resolved through `getMediaUrl()`:

```typescript
// From /client/src/lib/media.ts
export function getMediaUrl(url: string | undefined): string {
  if (!url) return '';
  
  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // S3 key - construct full URL
  if (url.startsWith('media/')) {
    return `https://justxempower-assets.s3.us-east-1.amazonaws.com/${url}`;
  }
  
  return url;
}
```

---

## 11. Known Issues and Problem Areas

### Issue 1: Video CORS Errors (S3 Configuration)

**Symptom:** Videos don't play in JE Hero blocks; console shows CORS errors.

**Location:** 
- `/client/src/components/page-builder/renderers/JEBlockRenderers.tsx` (lines 22-130)
- `/client/src/components/Hero.tsx` (lines 56-137)

**Root Cause:** S3 bucket `justxempower-assets` requires CORS configuration to allow video access from `justxempower.com`.

**Required S3 CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://justxempower.com", "https://www.justxempower.com"],
    "ExposeHeaders": ["Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

**Code Reference:**
```typescript
// JEBlockRenderers.tsx line 84-86
const handleError = (e: Event) => {
  console.error('[JEHeroRenderer] Video error:', e);
  setVideoError(true);
};
```

### Issue 2: Video Thumbnail Generation Fails

**Symptom:** Video thumbnails show black box with play icon instead of actual frame.

**Location:**
- `/client/src/components/VideoThumbnail.tsx`

**Root Cause:** Same CORS issue prevents canvas from capturing video frame.

**Code Reference:**
```typescript
// VideoThumbnail.tsx - canvas.drawImage fails due to CORS
const handleSeeked = () => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(video, 0, 0); // Fails with CORS error
};
```

### Issue 3: Page Builder Blocks Not Syncing to Content Editor

**Symptom:** Changes made in Page Builder don't appear in Content Editor.

**Location:**
- `/server/adminDb.ts` (lines 560-627) - `syncPageBlocksToSiteContent`
- `/server/adminRouters.ts` (lines 961-974) - sync trigger

**Root Cause:** Sync only triggers on block update, not on initial save. Also, section naming convention may not match Content Editor expectations.

**Code Reference:**
```typescript
// adminDb.ts line 593
const sectionName = `${blockType}-${block.order}`;
// Creates sections like 'je-hero-video-0' which Content Editor may not recognize
```

### Issue 4: Block Content JSON Parsing Errors

**Symptom:** Blocks fail to render with "Cannot read property of undefined" errors.

**Location:**
- `/server/adminDb.ts` (lines 397-413) - `getPageBlocks`
- `/client/src/components/BlockRenderer.tsx` (lines 114-125)

**Root Cause:** Content stored as plain string instead of JSON, or malformed JSON.

**Code Reference:**
```typescript
// adminDb.ts - defensive parsing
try {
  content = block.content ? JSON.parse(block.content) : {};
} catch {
  content = { html: block.content }; // Fallback for plain text
}
```

### Issue 5: Auto-Save Recovery Not Working Across Sessions

**Symptom:** Auto-saved work lost when browser is closed.

**Location:**
- `/client/src/components/page-builder/usePageBuilderStore.ts` (lines 293-325)

**Root Cause:** LocalStorage key includes pageId, but new pages have null pageId until first save.

**Code Reference:**
```typescript
// usePageBuilderStore.ts line 93-95
const getAutoSaveKey = (pageId: string | null) => {
  return pageId ? `${AUTO_SAVE_KEY}_${pageId}` : `${AUTO_SAVE_KEY}_new`;
};
// Issue: 'new' key gets overwritten by multiple new pages
```

### Issue 6: Media Picker Not Filtering by Type Correctly

**Symptom:** Video fields show images, image fields show videos.

**Location:**
- `/client/src/components/page-builder/panels/BlockSettings.tsx` (lines 176-221)

**Root Cause:** Field name detection logic may misidentify field types.

**Code Reference:**
```typescript
// BlockSettings.tsx - field type detection
if (key.toLowerCase().includes('image') || key.toLowerCase().includes('background')) {
  // This matches 'backgroundVideo' incorrectly as image field
}
```

### Issue 7: Block Order Not Persisting After Drag

**Symptom:** Blocks revert to original order after page refresh.

**Location:**
- `/client/src/components/page-builder/Canvas.tsx` (lines 248-272)
- `/server/adminDb.ts` (lines 496-506) - `reorderPageBlocks`

**Root Cause:** Order changes saved to local state but not immediately persisted to database.

**Potential Fix:** Add immediate database sync after drag end:
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  // ... existing reorder logic
  moveBlock(oldIndex, newIndex);
  
  // Add: Persist to database immediately
  await reorderBlocksMutation.mutateAsync(
    blocks.map((b, i) => ({ id: b.id, order: i }))
  );
};
```

---

## 12. Code File Reference

### Page Builder Components

| File | Path | Purpose |
|------|------|---------|
| PageBuilder.tsx | `/client/src/components/page-builder/PageBuilder.tsx` | Main Page Builder component |
| Canvas.tsx | `/client/src/components/page-builder/Canvas.tsx` | Block rendering canvas |
| usePageBuilderStore.ts | `/client/src/components/page-builder/usePageBuilderStore.ts` | Zustand state store |
| blockTypes.ts | `/client/src/components/page-builder/blockTypes.ts` | Block type definitions |
| BlockRenderer.tsx | `/client/src/components/page-builder/BlockRenderer.tsx` | Block rendering dispatcher |
| JEBlockRenderers.tsx | `/client/src/components/page-builder/renderers/JEBlockRenderers.tsx` | JE block renderers |
| BlockSettings.tsx | `/client/src/components/page-builder/panels/BlockSettings.tsx` | Block settings panel |
| BlockLibrary.tsx | `/client/src/components/page-builder/panels/BlockLibrary.tsx` | Block library panel |
| LayersPanel.tsx | `/client/src/components/page-builder/panels/LayersPanel.tsx` | Layers panel |
| PageLibrary.tsx | `/client/src/components/page-builder/panels/PageLibrary.tsx` | Page library panel |

### Admin Pages

| File | Path | Purpose |
|------|------|---------|
| AdminContent.tsx | `/client/src/pages/AdminContent.tsx` | Content Editor page |
| AdminPages.tsx | `/client/src/pages/AdminPages.tsx` | Pages Manager page |
| AdminMedia.tsx | `/client/src/pages/AdminMedia.tsx` | Media Library page |
| AdminDashboard.tsx | `/client/src/pages/AdminDashboard.tsx` | Admin dashboard |

### Backend Services

| File | Path | Purpose |
|------|------|---------|
| adminRouters.ts | `/server/adminRouters.ts` | Admin API routes |
| adminDb.ts | `/server/adminDb.ts` | Database operations |
| db.ts | `/server/db.ts` | Database connection |
| routers.ts | `/server/routers.ts` | Public API routes |
| storage.ts | `/server/storage.ts` | S3 storage operations |

### Database Schema

| File | Path | Purpose |
|------|------|---------|
| schema.ts | `/drizzle/schema.ts` | Drizzle ORM schema definitions |

### Shared Components

| File | Path | Purpose |
|------|------|---------|
| SectionVisualizer.tsx | `/client/src/components/SectionVisualizer.tsx` | Section visualization |
| MediaPicker.tsx | `/client/src/components/MediaPicker.tsx` | Media selection modal |
| VideoThumbnail.tsx | `/client/src/components/VideoThumbnail.tsx` | Video thumbnail generator |
| Hero.tsx | `/client/src/components/Hero.tsx` | Hero section component |

### Public Page Rendering

| File | Path | Purpose |
|------|------|---------|
| DynamicPage.tsx | `/client/src/pages/DynamicPage.tsx` | Dynamic page renderer |
| BlockRenderer.tsx | `/client/src/components/BlockRenderer.tsx` | Public block renderer |

---

## Summary

The Just Empower CMS is a sophisticated content management system that provides multiple editing interfaces for different use cases. The **Page Builder** offers visual drag-and-drop editing with JE-branded blocks, the **Content Editor** provides granular field-level control, and the **Pages Manager** handles page structure and navigation.

All three systems share a common database schema and synchronize through the `syncPageBlocksToSiteContent` function. The system includes robust auto-save functionality, undo/redo history, and media management through S3.

The primary issues currently affecting the system relate to S3 CORS configuration for video playback, synchronization between Page Builder and Content Editor, and some edge cases in block rendering. These issues have been documented with specific code locations and potential fixes.

---

*Document generated by Manus AI - January 8, 2026*
