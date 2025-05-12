const db = require('./db');
const fs = require('fs');
const path = require('path');

// List of migrations in order
const migrations = [
  '001_initial_schema.sql',
  '002_add_last_updated_days.sql',
  '003_create_assignees_tables.sql',
  '004_create_public_holidays.sql',
  '005_resource_allocation_enhancements.sql',
  '006_enhance_tasks_fields.sql',
  '007_update_tasks_subtask_structure.sql',
  '008_update_days_to_decimal.sql',
  '009_enforce_decimal_types.sql', // New migration
];

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Create migrations table if it doesn't exist to track applied migrations
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of already applied migrations
    const appliedResult = await db.query('SELECT name FROM migrations');
    const appliedMigrations = appliedResult.rows.map((row) => row.name);

    // Run migrations that haven't been applied yet
    for (const migration of migrations) {
      if (!appliedMigrations.includes(migration)) {
        console.log(`Applying migration: ${migration}...`);

        // Read and execute the migration file
        const migrationSQL = fs.readFileSync(
          path.join(__dirname, 'migrations', migration),
          'utf8'
        );

        // Begin transaction for this migration
        await db.query('BEGIN');

        try {
          // Run the migration
          await db.query(migrationSQL);

          // Record that the migration was applied
          await db.query('INSERT INTO migrations (name) VALUES ($1)', [
            migration,
          ]);

          await db.query('COMMIT');
          console.log(`✅ Migration ${migration} applied successfully`);
        } catch (err) {
          await db.query('ROLLBACK');
          console.error(`❌ Migration ${migration} failed:`, err);
          throw err;
        }
      } else {
        console.log(`Migration ${migration} already applied, skipping.`);
      }
    }

    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration process failed:', err);
    process.exit(1);
  }
}

runMigrations();
