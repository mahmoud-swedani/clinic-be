# Role & Permission Migration Guide

This guide explains how to migrate hardcoded roles and permissions to the database.

## Overview

The Clinic Management System initially used hardcoded roles and permissions. This migration script populates the database with:
- 5 system roles: `سكرتير`, `طبيب`, `محاسب`, `مدير`, `مالك`
- 39 permissions across various categories
- Role-permission assignments
- Updates all existing users to reference database roles

## Prerequisites

1. **Admin User Must Exist**: The migration requires an admin user with role `'مالك'` to exist.
   - If you don't have one, create it first: `npm run seed:admin`

2. **Database Connection**: Ensure your `.env` file has `MONGO_URI` configured correctly.

3. **Node.js**: Version 18-22 required.

## Migration Steps

### Step 1: Run the Migration

Execute the unified migration script:

```bash
npm run migrate:setup
```

This script will:
1. Create all 5 system roles in the database
2. Create all 39 permissions in the database
3. Assign permissions to roles based on default mappings
4. Update all existing users to have `roleId` populated
5. Set audit fields (`createdBy`, `updatedBy`) where possible

### Step 2: Verify Migration

After running the migration, verify everything was created correctly:

```bash
npm run migrate:verify
```

This will check:
- All 5 roles exist
- All 39+ permissions exist
- Role-permission assignments are correct
- All users have `roleId` populated

### Step 3: Verify in UI

1. Start the backend server: `npm run dev`
2. Start the frontend: `cd ../fe/clinic-fe && npm run dev`
3. Navigate to `/roles` page
4. You should see all 5 roles listed with permission counts

## What Gets Migrated

### Roles Created

- **سكرتير** (Secretary) - إدارة المواعيد والمرضى
- **طبيب** (Doctor) - إدارة العلاج والمراحل العلاجية
- **محاسب** (Accountant) - إدارة الحسابات المالية
- **مدير** (Manager) - إدارة شاملة للنظام
- **مالك** (Owner) - صلاحيات كاملة على النظام

### Permissions Created

The migration creates 39 permissions across these categories:
- `patients` (4 permissions)
- `appointments` (4 permissions)
- `treatment-stages` (4 permissions)
- `financial` (15 permissions)
- `products` (4 permissions)
- `sales` (4 permissions)
- `departments` (4 permissions)
- `services` (4 permissions)
- `users` (4 permissions)
- `roles` (4 permissions)
- `general` (1 permission)

### Permission Assignments

- **مالك**: All permissions (39)
- **مدير**: All permissions except role/permission management (35)
- **طبيب**: Treatment stages, patients view, appointments view (6)
- **محاسب**: Financial data permissions (8)
- **سكرتير**: Patients and appointments management (6)

## Idempotency

The migration script is **idempotent** - it's safe to run multiple times:
- Existing roles are skipped (not recreated)
- Existing permissions are skipped
- Existing role-permission assignments are skipped
- Users with `roleId` already set are skipped

## Troubleshooting

### Error: "No admin user found"

**Solution**: Create an admin user first:
```bash
npm run seed:admin
```

### Roles Management UI shows empty

**Solution**: 
1. Verify migration ran successfully: `npm run migrate:verify`
2. Check backend logs for errors
3. Ensure backend is running and connected to MongoDB
4. Check browser console for API errors

### Users don't have roleId after migration

**Solution**:
1. Check if users have valid role enum values (`سكرتير`, `طبيب`, etc.)
2. Ensure roles were created first: `npm run migrate:setup`
3. Re-run user migration: `npm run migrate:users`

### Permission counts showing 0

**Solution**:
1. Verify permissions were assigned: `npm run migrate:verify`
2. Check if `assignPermissionsToRoles` ran successfully
3. Re-run permission assignment: `npm run migrate:assign`

## Manual Migration Steps (Alternative)

If you prefer to run migrations step by step:

```bash
# Step 1: Create roles
npm run migrate:roles

# Step 2: Create permissions
npm run migrate:permissions

# Step 3: Assign permissions to roles
npm run migrate:assign

# Step 4: Update users with roleId
npm run migrate:users

# Step 5: Verify
npm run migrate:verify
```

## After Migration

Once migration is complete:

1. **Roles are now in database**: You can create, edit, and delete roles via the UI
2. **Permissions are now in database**: You can manage permissions via the UI
3. **Users reference database roles**: Users have `roleId` field populated
4. **Backward compatibility**: The `role` enum field is still present for compatibility

## Rollback (if needed)

If you need to rollback:

1. **Remove roles**: Delete all documents from `roles` collection
2. **Remove permissions**: Delete all documents from `permissions` collection
3. **Remove assignments**: Delete all documents from `rolepermissions` collection
4. **Clear user roleId**: Update all users to remove `roleId` field

**Note**: This will revert to hardcoded role system. Users will still have the `role` enum field.

## Support

For issues or questions:
1. Check migration logs for detailed error messages
2. Run `npm run migrate:verify` to see what's missing
3. Review the migration script output for warnings

## Next Steps

After successful migration:
1. Test the Role Management UI (`/roles`)
2. Test the Permission Management UI (`/permissions`)
3. Test assigning permissions to roles
4. Test creating new users with database roles
5. Verify all existing functionality still works

