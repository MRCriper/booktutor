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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const connectionString = getConnectionString();

  if (!connectionString) {
    return res.status(503).json({
      success: false,
      error: 'POSTGRES_URL_NOT_FOUND',
      message:
        'База данных не подключена: переменная окружения POSTGRES_URL не найдена. Убедитесь, что база данных Neon подключена к проекту в панели Vercel Storage.',
    });
  }

  const sql = neon(connectionString);

  // Initialize table if it doesn't exist
  const initDb = async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS booktutor_storage (
        id VARCHAR(64) PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
  };

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          // ignore
        }
      }

      if (!body || typeof body !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PAYLOAD',
          message: 'Некорректный формат данных для сохранения',
        });
      }

      await initDb();

      const payloadStr = JSON.stringify(body);

      await sql`
        INSERT INTO booktutor_storage (id, payload, updated_at)
        VALUES ('latest_snapshot', ${payloadStr}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = NOW();
      `;

      return res.status(200).json({
        success: true,
        provider: 'neon_postgres',
        message: 'Данные успешно сохранены в облачную базу данных Neon Postgres на Vercel!',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Neon save error:', err);
      return res.status(500).json({
        success: false,
        error: 'DB_WRITE_ERROR',
        message: `Ошибка записи в Neon Postgres: ${err.message || String(err)}`,
      });
    }
  }

  if (req.method === 'GET') {
    try {
      await initDb();

      const rows = await sql`
        SELECT payload, updated_at
        FROM booktutor_storage
        WHERE id = 'latest_snapshot'
        LIMIT 1;
      `;

      if (rows && rows.length > 0) {
        return res.status(200).json({
          success: true,
          provider: 'neon_postgres',
          updatedAt: rows[0].updated_at,
          data: rows[0].payload,
        });
      }

      return res.status(404).json({
        success: false,
        error: 'NO_DATA_YET',
        message: 'База данных пуста. Отправьте бэкап, чтобы инициализировать хранилище.',
      });
    } catch (err: any) {
      console.error('Neon read error:', err);
      return res.status(500).json({
        success: false,
        error: 'DB_READ_ERROR',
        message: `Ошибка чтения из Neon Postgres: ${err.message || String(err)}`,
      });
    }
  }

  return res.status(405).json({ error: 'Метод не поддерживается' });
}
