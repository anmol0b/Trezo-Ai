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

  try {
    await db.query(schema);
    console.log('✅ Migration complete\n');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    await closeDb();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});