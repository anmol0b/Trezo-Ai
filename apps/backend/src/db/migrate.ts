import { readFileSync } from 'fs';
import { join } from 'path';
import { getDb, closeDb, testConnection } from './client';

async function migrate(): Promise<void> {
  console.log('🔄 Running database migration...\n');

  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  const db = getDb();
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Split by statement and run each one
  const statements = schema
    .split(/;(?=(?:[^$]*\$\$[^$]*\$\$)*[^$]*$)/ms)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`📋 Running ${statements.length} SQL statements...\n`);

  for (const statement of statements) {
    try {
      await db.query(statement);
      // Print first line of each statement as progress
      const firstLine = statement.split('\n').find((l) => l.trim() && !l.startsWith('--'));
      if (firstLine) console.log(`  ✅ ${firstLine.trim().slice(0, 60)}`);
    } catch (err: any) {
      // Skip "already exists" errors — idempotent migrations
      if (err.message?.includes('already exists')) {
        console.log(`  ⏭️  Already exists — skipping`);
        continue;
      }
      console.error(`  ❌ Failed: ${err.message}`);
      console.error(`     Statement: ${statement.slice(0, 100)}`);
      throw err;
    }
  }

  console.log('\n✅ Migration complete\n');
  await closeDb();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});