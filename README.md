# NestJS Day 6 - Advanced Tasks

This project implements advanced NestJS features including case-insensitive email uniqueness, query operators, projection presets, pagination utilities, soft delete audit fields, and more.

## Features Implemented

### 1. Case-Insensitive Email Uniqueness
- Added `emailLower` field with unique index
- Pre-save/insert middleware automatically sets `emailLower` from `email.toLowerCase()`
- Migration script to backfill existing data

### 2. Advanced Query Operators
- `ageIn=20,25` - Find users with age in specified values
- `ageNin=30,40` - Find users with age not in specified values  
- `nameRegex=^sa.*` - Regex search on name field
- `hasPhone=true` - Find users with/without phone numbers

### 3. Projection Presets & Safe Fields
- `fields=basic` - Basic fields (name, email, age, phone, address, timestamps)
- `fields=admin` - Admin fields (includes soft delete fields)
- `fields=custom&customFields=name,email,age` - Custom field selection
- Whitelist validation prevents access to sensitive fields

### 4. Reusable Pagination Utility
- Standard pagination with `{total, page, pageSize, totalPages, hasNextPage, hasPrevPage}`
- Cursor-based pagination for large datasets
- Generic utility for future endpoints

### 5. Soft-Delete Audit Fields
- `isDeleted`, `deletedAt`, `deletedBy`, `deleteReason` fields
- Soft delete endpoint with audit information
- Restore endpoint to undelete users
- Default queries exclude deleted records

### 6. Global Index Management
- Script to ensure all required indexes are created
- Text search index with weights
- Compound indexes for performance

### 7. Cursor Pagination
- Forward-only cursor pagination using `_id`
- `limit` and `after` parameters
- Returns `{items, pageInfo: {endCursor, hasNextPage}}`

### 8. Text Search with Score
- Full-text search on name and email fields
- Results sorted by relevance score
- Requires text index to be created

### 9. Bulk Upsert Operations
- Bulk upsert users by email
- Handles duplicates automatically
- Idempotent operations

### 10. Statistics Aggregation
- User statistics with age ranges and creation trends
- Uses MongoDB aggregation pipeline with `$facet`
