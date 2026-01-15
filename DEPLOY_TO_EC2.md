# JustEmpower EC2 Deployment Guide
## Latest Update: Visual Section Mapper CMS

This deployment includes the new Visual Section Mapper CMS system with auto-sync functionality.

---

## Quick Deployment (One-Liner)

Connect to your EC2 via AWS Systems Manager Session Manager, then run:

```bash
cd /var/www/justxempower && git pull origin main && pnpm install && pnpm build && pm2 restart justxempower && pm2 status
```

---

## Step-by-Step Deployment

### Step 1: Connect to EC2
Use AWS Systems Manager Session Manager to connect to your EC2 instance.

### Step 2: Pull Latest Code
```bash
cd /var/www/justxempower
git pull origin main
```

### Step 3: Install Dependencies
```bash
pnpm install
```

### Step 4: Push Database Schema Changes
```bash
pnpm db:push
```

This will create/update the `pageSections` table with the following structure:
- `id` - Auto-increment primary key
- `pageId` - References pages.id
- `sectionType` - Enum of section types (hero, content, carousel, etc.)
- `sectionOrder` - Order of section on page
- `title` - Optional admin reference title
- `content` - JSON object with section-specific fields
- `requiredFields` - JSON array of required field names
- `isVisible` - 1 = visible, 0 = hidden
- `createdAt` / `updatedAt` - Timestamps

### Step 5: Build Production
```bash
pnpm build
```

### Step 6: Restart PM2
```bash
pm2 restart justxempower
pm2 status
```

### Step 7: Verify Deployment
```bash
pm2 logs justxempower --lines 50
```

---

## Database Seeding (If Needed)

If the `pageSections` table is empty after schema push, you can seed it with default sections.

### Option A: Via EC2 (Recommended)
Run the seed script on EC2:
```bash
cd /var/www/justxempower
node -e "
const sections = [
  { pageId: 1, sectionType: 'hero', sectionOrder: 0, title: 'Hero Section', content: JSON.stringify({title:'Just Empower',subtitle:'Catalyzing The Rise of Her'}), requiredFields: JSON.stringify(['title','backgroundImage']), isVisible: 1 },
  { pageId: 1, sectionType: 'content', sectionOrder: 1, title: 'Philosophy Preview', content: JSON.stringify({title:'The Philosophy',body:'Just Empower operates at the intersection of personal reclamation and collective influence.'}), requiredFields: JSON.stringify(['title','body']), isVisible: 1 },
  { pageId: 1, sectionType: 'community', sectionOrder: 2, title: 'Community Section', content: JSON.stringify({title:'Emerge With Us'}), requiredFields: JSON.stringify(['title']), isVisible: 1 },
  { pageId: 1, sectionType: 'newsletter', sectionOrder: 3, title: 'Newsletter', content: JSON.stringify({title:'Stay Connected',ctaText:'Subscribe'}), requiredFields: JSON.stringify(['title','ctaText']), isVisible: 1 },
  { pageId: 1, sectionType: 'footer', sectionOrder: 4, title: 'Footer', content: JSON.stringify({copyright:'© 2025 Just Empower'}), requiredFields: JSON.stringify(['copyright']), isVisible: 1 }
];
console.log('Sections to seed:', sections.length);
"
```

### Option B: Via MySQL Client
Connect to RDS and run the SQL from `RDS_PAGESECTIONS_SEED.sql`:
```bash
mysql -h justxempower-mysql.cg7k02qmmmt6.us-east-1.rds.amazonaws.com -u justxempower -p justxempower < RDS_PAGESECTIONS_SEED.sql
```

---

## New Features in This Deployment

### 1. PageSections tRPC Router
Full CRUD operations for managing page sections:
- `pageSections.getByPage` - Get sections for a page by ID
- `pageSections.getByPageSlug` - Get sections by page slug
- `pageSections.create` - Create new section (admin)
- `pageSections.update` - Update section (admin)
- `pageSections.delete` - Delete section (admin)
- `pageSections.reorder` - Reorder sections (admin)
- `pageSections.bulkCreate` - Create multiple sections (admin)

### 2. Auto-Sync Functionality
When a new page is created in the Page Builder:
- Default sections are automatically generated based on page type
- No manual section creation needed

### 3. Completeness Tracking
- `pageSections.getPageCompleteness` - Returns fill status for each section
- Shows which required fields are filled vs missing
- Overall completeness percentage per page

### 4. Scan & Sync APIs
- `pageSections.syncSectionsForPage` - Sync sections for a specific page
- `pageSections.scanAndSyncAllPages` - Bulk sync all pages

---

## Troubleshooting

### If PM2 shows errors:
```bash
pm2 logs justxempower --err --lines 100
```

### If database connection fails:
Check the DATABASE_URL environment variable:
```bash
pm2 env justxempower | grep DATABASE
```

### If schema push fails:
```bash
cd /var/www/justxempower
pnpm drizzle-kit push:mysql --verbose
```

---

## Rollback (If Needed)

To rollback to previous version:
```bash
cd /var/www/justxempower
git log --oneline -5  # Find previous commit hash
git checkout <commit-hash>
pnpm install
pnpm build
pm2 restart justxempower
```
