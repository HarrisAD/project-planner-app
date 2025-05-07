const db = require('./db');
const fs = require('fs');
const path = require('path');
const migrations = [
  '001_initial_schema.sql',
  '002_add_last_updated_days.sql',
  '003_create_assignees_tables.sql',
  '004_create_public_holidays.sql',
  '005_resource_allocation_enhancements.sql', // Add this line
];

async function runMigration() {
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_initial_schema.sql'),
      'utf8'
    );

    await db.query(migrationSQL);
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
