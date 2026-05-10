import { Pool } from 'pg';
import { config } from '../config';

let _pool: Pool | null = null;

export function getDb(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: config.database.url,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    _pool.on('error', (err) => {
      console.error('❌ Database pool error:', err.message);
    });
  }
  return _pool;
}

export async function closeDb(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const db = getDb();
    await db.query('SELECT 1');
    console.log('✅ Database connected');
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    return false;
  }
}