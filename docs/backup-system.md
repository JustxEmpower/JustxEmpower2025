# Backup System Documentation

## Overview

The backup system allows administrators to create, download, restore, and delete database backups. Backups are stored both in the database (as a fallback) and in S3 for reliable long-term storage.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Admin Dashboard UI                          │
│                   (AdminBackup.tsx)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Create    │ │  Download   │ │   Restore   │ │  Delete   │ │
│  │   Backup    │ │   Backup    │ │   Backup    │ │  Backup   │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
└─────────┼───────────────┼───────────────┼──────────────┼───────┘
          │               │               │              │
          ▼               ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      tRPC API Layer                             │
│                   (adminRouters.ts)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   backups.  │ │   backups.  │ │   backups.  │ │  backups. │ │
│  │   create    │ │   download  │ │   restore   │ │  delete   │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬─────┘ │
└─────────┼───────────────┼───────────────┼──────────────┼───────┘
          │               │               │              │
          ▼               ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Storage Layer                              │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐│
│  │     MySQL/TiDB      │    │           AWS S3                ││
│  │   (backups table)   │    │    (backups/{timestamp}.json)   ││
│  │   - metadata        │    │    - full backup JSON           ││
│  │   - s3Url reference │    │    - long-term storage          ││
│  └─────────────────────┘    └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### `backups` Table

```sql
CREATE TABLE backups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  backupName VARCHAR(255) NOT NULL,        -- User-provided name
  backupType VARCHAR(50) NOT NULL,         -- 'manual', 'scheduled', 'auto'
  backupData TEXT,                         -- JSON dump (fallback if S3 fails)
  s3Key VARCHAR(500),                      -- S3 storage key
  s3Url VARCHAR(1000),                     -- S3 URL for direct access
  fileSize INT NOT NULL,                   -- Size in bytes
  description TEXT,                        -- Optional description
  tablesIncluded TEXT,                     -- JSON array of table names
  createdBy VARCHAR(100),                  -- Admin username
  createdAt TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### 1. List Backups
**Endpoint:** `trpc.admin.backups.list`  
**Method:** Query  
**Auth:** Admin only

Returns all backups ordered by creation date (newest first).

```typescript
const backups = trpc.admin.backups.list.useQuery();
// Returns: Backup[]
```

---

### 2. Create Backup
**Endpoint:** `trpc.admin.backups.create`  
**Method:** Mutation  
**Auth:** Admin only

Creates a snapshot of the current database state.

**Input:**
```typescript
{
  backupName: string,           // Required - descriptive name
  description?: string,         // Optional - what changed
  backupType?: 'manual' | 'auto' | 'scheduled'  // Default: 'manual'
}
```

**Process:**
1. Exports all tables to JSON:
   - articles, pages, pageBlocks, siteContent, media
   - themeSettings, navigation, seoSettings, brandAssets
   - formFields, formSubmissions, redirects, siteSettings
   - blockTemplates, users, aiSettings, aiChatConversations
   - products, productCategories, orders, events

2. Uploads to S3 (primary storage)
3. Falls back to database storage if S3 fails
4. Records metadata in `backups` table

**Response:**
```typescript
{ success: true, s3Url: string | null }
```

---

### 3. Download Backup
**Endpoint:** `trpc.admin.backups.download`  
**Method:** Query  
**Auth:** Admin only

Downloads backup data as JSON.

**Input:**
```typescript
{ backupId: number }
```

**Process:**
1. Fetches backup metadata from database
2. If S3 URL exists, fetches from S3
3. Falls back to database-stored data

**Response:**
```typescript
{ backupData: string, s3Url: string | null }
```

---

### 4. Restore Backup
**Endpoint:** `trpc.admin.backups.restore`  
**Method:** Mutation  
**Auth:** Admin only

⚠️ **CRITICAL OPERATION** - Restores database to backup state.

**Input:**
```typescript
{ backupId: number }
```

**Safety Checks (Added after data loss incident):**
1. Validates backup has actual data
2. Counts tables with data and total records
3. **REFUSES to restore if:**
   - 0 tables have data
   - Less than 5 total records
4. Only deletes existing data if backup data exists for that table

**Process:**
1. Fetches backup data (from S3 or database)
2. Validates backup is not empty/corrupted
3. For each table with backup data:
   - Deletes existing records
   - Inserts backup records in batches of 100

**Response:**
```typescript
{
  success: true,
  restored: string[],           // Tables restored with record counts
  errors?: string[],            // Any errors encountered
  summary: string               // Human-readable summary
}
```

---

### 5. Delete Backup
**Endpoint:** `trpc.admin.backups.delete`  
**Method:** Mutation  
**Auth:** Admin only

Deletes backup metadata from database. Note: S3 files are NOT deleted (kept as permanent archive).

**Input:**
```typescript
{ backupId: number }
```

---

## Frontend Component

### AdminBackup.tsx

Located at: `client/src/pages/AdminBackup.tsx`

**Features:**
- List all backups with metadata (name, type, size, date)
- Create new backup with custom name
- Download backup as JSON file
- Restore from backup with confirmation dialog
- Delete backup with confirmation

**Key UI Elements:**

1. **Warning Card** - Best practices for backups
2. **Create Backup Dialog** - Name input and create button
3. **Backup List** - Shows all backups with actions
4. **Restore Confirmation Dialog** - Shows backup details and warning

**State Management:**
```typescript
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
const [backupName, setBackupName] = useState("");
```

**tRPC Hooks:**
```typescript
const backupsQuery = trpc.admin.backups.list.useQuery();
const createMutation = trpc.admin.backups.create.useMutation();
const restoreMutation = trpc.admin.backups.restore.useMutation();
const deleteMutation = trpc.admin.backups.delete.useMutation();
```

---

## Data Flow

### Create Backup Flow
```
User clicks "Create Backup"
    │
    ▼
Enter backup name in dialog
    │
    ▼
handleCreateBackup() called
    │
    ▼
createMutation.mutateAsync({ backupName })
    │
    ▼
Server: Export all tables to JSON
    │
    ▼
Server: Upload to S3 (or fallback to DB)
    │
    ▼
Server: Insert metadata into backups table
    │
    ▼
Success toast + refresh list
```

### Restore Backup Flow
```
User clicks restore icon on backup
    │
    ▼
Confirmation dialog opens
    │
    ▼
User clicks "Restore Backup"
    │
    ▼
handleRestore() called
    │
    ▼
restoreMutation.mutateAsync({ backupId })
    │
    ▼
Server: Fetch backup data (S3 or DB)
    │
    ▼
Server: SAFETY CHECK - validate backup has data
    │
    ├── If empty/corrupted → Error: "Backup appears empty"
    │
    ▼
Server: For each table with data:
    ├── Delete existing records
    └── Insert backup records
    │
    ▼
Success toast + page reload
```

---

## Tables Backed Up

| Table | Description |
|-------|-------------|
| articles | Blog/journal articles |
| pages | CMS pages |
| pageBlocks | Page Builder blocks |
| siteContent | Page content sections |
| media | Media library items |
| themeSettings | Theme configuration |
| navigation | Navigation menus |
| seoSettings | SEO configuration |
| brandAssets | Brand logos/colors |
| formFields | Form configurations |
| formSubmissions | Form responses |
| redirects | URL redirects |
| siteSettings | General site settings |
| blockTemplates | Page Builder templates |
| users | User accounts |
| aiSettings | AI configuration |
| aiChatConversations | AI chat history |
| products | Shop products |
| productCategories | Product categories |
| orders | Shop orders |
| events | Calendar events |

---

## Safety Features

### 1. Empty Backup Protection
The restore function now checks:
```typescript
if (tablesWithData === 0 || totalRecords < 5) {
  throw new TRPCError({ 
    code: "BAD_REQUEST", 
    message: `Backup appears empty or corrupted...` 
  });
}
```

### 2. Conditional Delete
Only deletes existing data if backup has data for that table:
```typescript
if (backupData[table] && backupData[table].length > 0) {
  await db.delete(tableSchema);  // Only delete if we have data to restore
  await db.insert(tableSchema).values(backupData[table]);
}
```

### 3. Batch Inserts
Large datasets are inserted in batches to prevent timeouts:
```typescript
const batchSize = 100;
for (let i = 0; i < backupData[table].length; i += batchSize) {
  const batch = backupData[table].slice(i, i + batchSize);
  await db.insert(tableSchema).values(batch);
}
```

### 4. S3 Archive
Deleted backups keep their S3 files as a permanent archive.

---

## Best Practices

1. **Create backups before major changes** - Always backup before updating content or making structural changes
2. **Download backups locally** - Keep copies on your local machine for safekeeping
3. **Use descriptive names** - Name backups clearly (e.g., "Before homepage redesign")
4. **Test restores in development** - If possible, test restore in a dev environment first
5. **Regular backups** - Create backups at least weekly for active sites

---

## Troubleshooting

### Backup Creation Fails
- Check S3 credentials and permissions
- Verify database connection is stable
- Check server logs for specific errors

### Restore Fails
- Verify backup file is not corrupted
- Check if backup has sufficient data (>5 records)
- Look for foreign key constraint errors in logs

### Download Fails
- Check if S3 URL is accessible
- Verify backup data exists in database fallback
- Check network connectivity to S3

---

## Future Enhancements

- [ ] Add confirmation dialog with preview of what will be restored
- [ ] Scheduled automatic backups
- [ ] Selective table restore (choose which tables to restore)
- [ ] Backup comparison tool
- [ ] Email notifications for backup operations
