# Database Migrations

This directory contains database migration scripts for the Raven UGC Platform.

## Initial Schema

The initial schema is in `../schema.sql`. Run it in Supabase SQL Editor for a fresh setup.

## Migration Naming Convention

```
YYYYMMDD_HHMMSS_description.sql
```

Example:
```
20250116_100000_initial_schema.sql
20250117_143000_add_video_duration.sql
```

## How to Create a Migration

1. Create a new file with the timestamp prefix
2. Write your SQL changes
3. Test in a development database first
4. Document the changes in the file header

## Example Migration

```sql
-- Migration: 20250117_143000_add_video_duration
-- Description: Add duration field to videos table
-- Author: Developer Name
-- Date: 2025-01-17

-- Forward migration
ALTER TABLE videos
ADD COLUMN duration_seconds INTEGER DEFAULT 8;

COMMENT ON COLUMN videos.duration_seconds IS 'Video duration in seconds (default: 8)';

-- Rollback (if needed)
-- ALTER TABLE videos DROP COLUMN duration_seconds;
```

## Running Migrations

### Via Supabase Dashboard

1. Go to SQL Editor
2. Open the migration file
3. Click Run

### Via CLI (if using Supabase CLI)

```bash
supabase db push
```

## Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2025-01-16 | Initial | Created all base tables, functions, triggers |

## Best Practices

1. **Always test first** in a development database
2. **Include rollback SQL** as comments
3. **Keep migrations small** and focused
4. **Never modify** already-run migrations
5. **Document breaking changes** clearly
