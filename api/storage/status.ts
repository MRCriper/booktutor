import { neon } from '@neondatabase/serverless';

function getConnectionString(): string | null {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const connectionString = getConnectionString();

  if (!connectionString) {
    return res.status(200).json({
      connected: false,
      provider: 'none',
      message: 'Переменная окружения POSTGRES_URL не найдена. Если база данных создана, проверьте связь с проектом и выполните повторный деплой (Redeploy).',
    });
  }

  try {
    const sql = neon(connectionString);
    const testResult = await sql`SELECT 1 as alive, current_database() as db_name, version() as pg_version;`;
    
    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'booktutor_storage'
      ) as table_exists;
    `;

    let lastUpdated: string | null = null;
    let dataSummary = null;

    if (tableCheck[0]?.table_exists) {
      const row = await sql`
        SELECT updated_at, (payload->>'exportedAt') as exported_at
        FROM booktutor_storage 
        WHERE id = 'latest_snapshot'
        LIMIT 1;
      `;
      if (row.length > 0) {
        lastUpdated = row[0].updated_at;
      }
    }

    return res.status(200).json({
      connected: true,
      provider: 'neon_postgres',
      database: testResult[0]?.db_name || 'postgres',
      serverTime: new Date().toISOString(),
      tableReady: Boolean(tableCheck[0]?.table_exists),
      lastUpdated,
      message: 'Подключение к Neon Postgres на Vercel активно!',
    });
  } catch (err: any) {
    return res.status(200).json({
      connected: false,
      provider: 'neon_postgres',
      error: err.message || String(err),
      message: `Ошибка подключения к базе Neon: ${err.message}`,
    });
  }
}
