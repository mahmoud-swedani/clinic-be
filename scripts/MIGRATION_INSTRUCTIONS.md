# Patient Fields Migration Instructions

## Overview
This migration script adds new fields to existing patients in the database, generates `refNumber` for patients that don't have one, and migrates old data to the new structure.

## What the Migration Does

1. **Generates `refNumber`**: Creates unique reference numbers (PAT-001, PAT-002, etc.) for patients without one
2. **Splits `fullName`**: Breaks down existing `fullName` into `firstName`, `fatherName`, and `lastName`
3. **Sets Default Values**:
   - Sets `nationality` to 'سوري' if not set
   - Sets `patientClassification` to 'new' if not set
   - Sets `dateFileOpening` to `createdAt` date if not set
4. **Converts Address**: Converts old string `address` to new object structure `{city, region, street}`
5. **Migrates Medical History**: Copies `medicalHistory` to `currentMedicalHistory` if needed

## Prerequisites

1. Make sure your `.env` file has the correct `MONGODB_URI`
2. Ensure the database is accessible
3. **IMPORTANT**: Backup your database before running the migration

## How to Run

### Option 1: Using npm script (Recommended)
```bash
cd clinic-be
npm run migrate:patients
```

### Option 2: Using ts-node directly
```bash
cd clinic-be
npx ts-node scripts/migratePatientFields.ts
```

### Option 3: Using pnpm (if you use pnpm)
```bash
cd clinic-be
pnpm migrate:patients
```

## Expected Output

The script will show:
- Connection status
- Number of patients found
- Progress for each patient migrated
- Summary at the end:
  - Total patients processed
  - Number of patients migrated
  - Number of refNumbers generated

Example output:
```
✅ Connected to MongoDB
📋 Found 150 patients to migrate
✅ Migrated patient: أحمد محمد علي
✅ Migrated patient: فاطمة حسن
...
✅ Migration completed!
   - Total patients processed: 150
   - Patients migrated: 150
   - RefNumbers generated: 150
✅ Disconnected from MongoDB
```

## Safety Notes

1. **Backup First**: Always backup your database before running migrations
2. **Test Environment**: Test the migration on a development/staging database first
3. **Idempotent**: The script is safe to run multiple times - it only updates fields that are missing
4. **No Data Loss**: The script preserves all existing data and only adds new fields

## Troubleshooting

### Error: MONGODB_URI is not defined
- Make sure your `.env` file exists in the `clinic-be` directory
- Check that `MONGODB_URI` is set in the `.env` file

### Error: Cannot find module
- Make sure you're in the `clinic-be` directory
- Run `npm install` to ensure all dependencies are installed

### Connection timeout
- Check your MongoDB connection string
- Ensure MongoDB is running and accessible
- Check network/firewall settings

## After Migration

After running the migration:
1. Verify the data in your database
2. Check a few patient records to ensure fields were migrated correctly
3. Test the patient form in the frontend to ensure it works with the new fields

