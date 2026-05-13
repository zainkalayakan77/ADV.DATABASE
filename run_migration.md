# How to Run Database Migration

## Your Database Configuration
- **Host:** localhost
- **User:** root
- **Password:** (empty)
- **Database:** student_tracker

## Option 1: Using MySQL Command Line (Recommended)

### Step 1: Open Command Prompt or Terminal

### Step 2: Navigate to your project directory
```bash
cd path/to/your/project
```

### Step 3: Run the migration
```bash
mysql -u root student_tracker < Database/archive_feature_update.sql
```

If you have a password (even though yours is empty), use:
```bash
mysql -u root -p student_tracker < Database/archive_feature_update.sql
```

## Option 2: Using MySQL Workbench (GUI)

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Select the `student_tracker` database
4. Click on "File" → "Open SQL Script"
5. Navigate to `Database/archive_feature_update.sql`
6. Click the lightning bolt icon (⚡) to execute
7. Check for success message

## Option 3: Using phpMyAdmin

1. Open phpMyAdmin in your browser (usually http://localhost/phpmyadmin)
2. Select the `student_tracker` database from the left sidebar
3. Click on the "SQL" tab at the top
4. Copy the contents of `Database/archive_feature_update.sql`
5. Paste into the SQL query box
6. Click "Go" to execute

## Option 4: Using Node.js Script (Automated)

I can create a Node.js script that runs the migration automatically.
See `run_migration.js` in your project root.

## Verify Migration Success

After running the migration, verify it worked:

```sql
DESCRIBE Enrollments;
```

You should see two new columns:
- `is_archived` (tinyint(1), Default: 0)
- `archived_at` (timestamp, Default: NULL)

## Troubleshooting

### Error: "Access denied"
- Check your MySQL username and password
- Make sure MySQL server is running

### Error: "Database doesn't exist"
- Make sure you've created the `student_tracker` database
- Run: `CREATE DATABASE student_tracker;`

### Error: "Table doesn't exist"
- Make sure you've run the initial schema first
- Run: `mysql -u root student_tracker < Database/schema.sql`

### Error: "Column already exists"
- The migration has already been run
- You can skip this step

## What This Migration Does

Adds two columns to the `Enrollments` table:
1. **is_archived** - Allows students to personally archive classes
2. **archived_at** - Tracks when the class was archived

This enables the new feature where students can archive classes without affecting the teacher's view.
