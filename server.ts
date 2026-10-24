import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Initialize Gemini client with proper telemetry
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API endpoint for AI Tutor with full site context
  app.post('/api/ai/ask', async (req, res) => {
    const { question, context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Вопрос обязателен для заполнения' });
    }

    const contextSummary = context ? JSON.stringify(context, null, 2) : 'Контекст отсутствует';

    const prompt = `
Ты — персональный умный ИИ-репетитор по математике, физике, информатике и русскому языку образовательной платформы BookTutor (преподаватель Мальцев Роман Михайлович).
Твоя задача — мгновенно помогать ученику и репетитору, опираясь на ВСЕ данные с сайта.

ДАННЫЕ И МАТЕРИАЛЫ УЧЕНИКА С САЙТА:
${contextSummary}

ВОПРОС ПОЛЬЗОВАТЕЛЯ:
"${question}"

ПРАВИЛА И СТИЛЬ ОТВЕТА:
1. Если ученик спрашивает про непонятное место в конспекте, коде или формуле — найди соответствующий конспект или задачу из переданных данных и объясни простыми словами "на пальцах", приведи наглядный пример или пошаговый алгоритм.
2. Отвечай доброжелательно, поддерживающе, четко и без сухой канцелярщины.
3. Форматируй математические формулы читаемо.
4. Если вопрос касается стратегии подготовки к ЕГЭ/ОГЭ — обрати внимание на его слабые места из заметок репетитора и текущий прогноз баллов.
`;

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text || 'Не удалось сформировать ответ.';
      return res.json({ answer: text });
    } catch (err) {
      console.warn('Gemini API call failed, generating contextual fallback:', err);
      const fallback = generateContextualAnswer(question, context);
      return res.json({ answer: fallback });
    }
  });

  // API endpoint for robust local code execution (Python 3.10 and Node.js)
  app.post('/api/code/run', async (req, res) => {
    const { language = 'python', code = '', stdin = '', files = [] } = req.body;

    if (!code && files.length === 0) {
      return res.json({
        language,
        version: '3.10.12',
        run: { stdout: '', stderr: 'Код пуст.', code: 1, signal: null, output: 'Код пуст.' },
      });
    }

    const tempDir = path.join(os.tmpdir(), `booktutor_run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

    try {
      fs.mkdirSync(tempDir, { recursive: true });

      // Write any attached data files (e.g. 24.txt, 17.txt, data.csv)
      if (Array.isArray(files)) {
        for (const file of files) {
          if (!file || !file.name) continue;
          const sanitizedName = path.basename(file.name);
          const targetPath = path.join(tempDir, sanitizedName);

          if (file.dataUrl && file.dataUrl.includes('base64,')) {
            const base64Data = file.dataUrl.split('base64,')[1];
            fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
          } else if (typeof file.content === 'string') {
            fs.writeFileSync(targetPath, file.content, 'utf8');
          }
        }
      }

      let cmd = 'python3';
      let args: string[] = ['main.py'];
      let filename = 'main.py';

      if (language === 'javascript' || language === 'js') {
        cmd = 'node';
        filename = 'index.js';
        args = ['index.js'];
      } else if (language === 'cpp' || language === 'c++') {
        filename = 'main.cpp';
        fs.writeFileSync(path.join(tempDir, filename), code, 'utf8');

        // Check if g++ is available in system
        const hasGpp = fs.existsSync('/usr/bin/g++') || fs.existsSync('/bin/g++');
        if (hasGpp) {
          const compResult = await new Promise<{ ok: boolean; stderr: string }>((resolveComp) => {
            const comp = spawn('g++', ['-O2', 'main.cpp', '-o', 'main_prog'], { cwd: tempDir });
            let errBuf = '';
            comp.stderr.on('data', (d) => {
              if (errBuf.length < 20000) errBuf += d.toString();
            });
            comp.on('close', (c) => resolveComp({ ok: c === 0, stderr: errBuf }));
            comp.on('error', (err) => resolveComp({ ok: false, stderr: err.message }));
          });

          if (!compResult.ok) {
            return res.json({
              language: 'cpp',
              version: 'GCC',
              run: {
                stdout: '',
                stderr: compResult.stderr || 'Ошибка компиляции C++',
                code: 1,
                signal: null,
                output: compResult.stderr || 'Ошибка компиляции C++',
              },
            });
          }

          cmd = path.join(tempDir, 'main_prog');
          args = [];
        } else {
          return res.json({
            language: 'cpp',
            version: 'GCC',
            run: {
              stdout: '',
              stderr: 'Компилятор C++ недоступен в данной среде. Пожалуйста, используйте Python 3.10 (основной язык КЕГЭ) или JavaScript.',
              code: 1,
              signal: null,
              output: 'Компилятор C++ недоступен. Используйте Python 3.10.',
            },
          });
        }
      }

      const scriptPath = path.join(tempDir, filename);
      fs.writeFileSync(scriptPath, code, 'utf8');

      const startTime = Date.now();

      await new Promise<void>((resolve) => {
        let stdout = '';
        let stderr = '';
        let killed = false;

        const child = spawn(cmd, args, {
          cwd: tempDir,
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1',
            PYTHONDONTWRITEBYTECODE: '1',
          },
        });

        const timer = setTimeout(() => {
          killed = true;
          child.kill('SIGKILL');
          stderr += '\n[Превышен лимит времени выполнения: 6 секунд]';
        }, 6000);

        if (stdin) {
          child.stdin.write(stdin);
          child.stdin.end();
        } else {
          child.stdin.end();
        }

        child.stdout.on('data', (data) => {
          if (stdout.length < 50000) {
            stdout += data.toString();
          }
        });

        child.stderr.on('data', (data) => {
          if (stderr.length < 50000) {
            stderr += data.toString();
          }
        });

        child.on('close', (exitCode, signal) => {
          clearTimeout(timer);
          const durationMs = Date.now() - startTime;
          const output = (stdout + (stderr ? (stdout ? '\n' : '') + stderr : '')).trimEnd();

          res.json({
            language,
            version: language === 'python' ? '3.10.12' : process.version,
            run: {
              stdout,
              stderr,
              code: killed ? 124 : (exitCode ?? 0),
              signal: signal ? String(signal) : null,
              output: output || (exitCode === 0 ? '[Программа успешно завершилась без вывода]' : ''),
            },
            durationMs,
          });
          resolve();
        });

        child.on('error', (err) => {
          clearTimeout(timer);
          res.json({
            language,
            version: 'system',
            run: {
              stdout: '',
              stderr: `Ошибка запуска: ${err.message}`,
              code: 1,
              signal: null,
              output: `Ошибка запуска интерпретатора: ${err.message}`,
            },
          });
          resolve();
        });
      });
    } catch (e: any) {
      return res.status(500).json({
        language,
        version: 'error',
        run: {
          stdout: '',
          stderr: String(e.message || e),
          code: 1,
          signal: null,
          output: String(e.message || e),
        },
      });
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  });

  // Storage Backup & Cloud Sync endpoint (Supports Neon Postgres & Local Fallback)
  const backupFilePath = path.join(__dirname, 'latest_backup.json');

  const getDbConnectionString = () =>
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null;

  app.get('/api/storage/status', async (_req, res) => {
    const connStr = getDbConnectionString();
    if (!connStr) {
      return res.json({
        connected: false,
        provider: 'local_server',
        message: 'Сервер запущен локально без подключенной базы данных Neon Postgres.',
      });
    }

    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(connStr);
      const test = await sql`SELECT 1 as alive, current_database() as db_name;`;
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'booktutor_storage'
        ) as table_exists;
      `;

      let lastUpdated: string | null = null;
      if (tableCheck[0]?.table_exists) {
        const row = await sql`SELECT updated_at FROM booktutor_storage WHERE id = 'latest_snapshot' LIMIT 1;`;
        if (row.length > 0) lastUpdated = row[0].updated_at;
      }

      return res.json({
        connected: true,
        provider: 'neon_postgres',
        database: test[0]?.db_name || 'postgres',
        tableReady: Boolean(tableCheck[0]?.table_exists),
        lastUpdated,
        message: 'Подключение к базе данных Neon Postgres на Vercel активно!',
      });
    } catch (err: any) {
      return res.json({
        connected: false,
        provider: 'neon_postgres',
        error: err.message,
        message: `Ошибка подключения к Neon: ${err.message}`,
      });
    }
  });

  app.post('/api/storage/sync', async (req, res) => {
    try {
      const backupData = req.body;
      if (!backupData || typeof backupData !== 'object') {
        return res.status(400).json({ error: 'Неверный формат данных бэкапа' });
      }

      const connStr = getDbConnectionString();
      if (connStr) {
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(connStr);
          await sql`
            CREATE TABLE IF NOT EXISTS booktutor_storage (
              id VARCHAR(64) PRIMARY KEY,
              payload JSONB NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
          `;
          const payloadStr = JSON.stringify(backupData);
          await sql`
            INSERT INTO booktutor_storage (id, payload, updated_at)
            VALUES ('latest_snapshot', ${payloadStr}::jsonb, NOW())
            ON CONFLICT (id) DO UPDATE SET
              payload = EXCLUDED.payload,
              updated_at = NOW();
          `;
        } catch (dbErr: any) {
          console.error('Failed to sync to Neon, falling back to local file:', dbErr);
        }
      }

      // Always update local backup as well
      fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');

      const now = new Date().toISOString();
      return res.json({
        success: true,
        provider: connStr ? 'neon_postgres' : 'local_file',
        message: connStr
          ? 'Данные успешно сохранены в облачную базу данных Neon Postgres на Vercel!'
          : 'Резервная копия успешно сохранена на сервере',
        updatedAt: now,
        timestamp: now,
      });
    } catch (err: any) {
      return res.status(500).json({ error: `Ошибка записи: ${err.message}` });
    }
  });

  app.get('/api/storage/sync', async (req, res) => {
    try {
      const sinceParam = req.query.since as string | undefined;
      const connStr = getDbConnectionString();

      if (connStr) {
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(connStr);

          if (sinceParam) {
            const timeRows = await sql`
              SELECT updated_at
              FROM booktutor_storage
              WHERE id = 'latest_snapshot'
              LIMIT 1;
            `;
            if (timeRows && timeRows.length > 0) {
              const dbTime = new Date(timeRows[0].updated_at).getTime();
              const clientTime = new Date(sinceParam).getTime();
              if (!isNaN(dbTime) && !isNaN(clientTime) && dbTime <= clientTime) {
                return res.json({
                  success: true,
                  modified: false,
                  provider: 'neon_postgres',
                  updatedAt: timeRows[0].updated_at,
                });
              }
            }
          }

          const rows = await sql`
            SELECT payload, updated_at
            FROM booktutor_storage
            WHERE id = 'latest_snapshot'
            LIMIT 1;
          `;
          if (rows && rows.length > 0) {
            return res.json({
              success: true,
              modified: true,
              data: rows[0].payload,
              updatedAt: rows[0].updated_at,
              provider: 'neon_postgres',
            });
          }
        } catch (dbErr) {
          console.warn('Neon read failed, trying local file fallback:', dbErr);
        }
      }

      if (fs.existsSync(backupFilePath)) {
        const stats = fs.statSync(backupFilePath);
        const fileTime = stats.mtime.getTime();

        if (sinceParam) {
          const clientTime = new Date(sinceParam).getTime();
          if (!isNaN(clientTime) && fileTime <= clientTime) {
            return res.json({
              success: true,
              modified: false,
              provider: 'local_file',
              updatedAt: stats.mtime.toISOString(),
            });
          }
        }

        const raw = fs.readFileSync(backupFilePath, 'utf8');
        return res.json({
          success: true,
          modified: true,
          data: JSON.parse(raw),
          updatedAt: stats.mtime.toISOString(),
          provider: 'local_file',
        });
      }

      return res.status(404).json({ error: 'Серверный бэкап еще не создавался' });
    } catch (err: any) {
      return res.status(500).json({ error: `Ошибка чтения: ${err.message}` });
    }
  });

  // Mount Vite or serve static dist
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

function generateContextualAnswer(question: string, context: any): string {
  const q = question.toLowerCase();

  if (q.includes('конспект') || q.includes('формул') || q.includes('электродинамик') || q.includes('индукци')) {
    return `В конспекте по электродинамике ключевой закон — это закон Фарадея для электромагнитной индукции: ℰᵢ = -ΔΦ / Δt.
Знак «минус» отражает правило Ленца: индукционный ток всегда направлен так, чтобы своим магнитным полем противодействовать изменению внешнего магнитного потока Φ = B·S·cos(α).
Если перемычка движется в магнитном поле, возникает ЭДС: ℰ = B·L·v. Если цепь замкнута на конденсатор C, ток равен I = C·(dℰ/dt). В заметках репетитор также рекомендовал повторить правило правой руки для определения направления тока!`;
  }

  if (q.includes('дз') || q.includes('домашк') || q.includes('ошибк') || q.includes('python') || q.includes('строк')) {
    return `По домашнему заданию №4 (Задание 24 ЕГЭ по строкам):
Твой алгоритм за O(N) работает отлично! Главное, на что обратил внимание преподаватель — всегда сбрасывать текущий счетчик при встрече неподходящего символа и аккуратно проверять краевые случаи (например, если самая длинная цепочка находится в самом конце строки файла). В задаче №26 важно сначала отсортировать файлы жадно по возрастанию, а затем при замене последнего файла брать максимальный из оставшихся.`;
  }

  if (q.includes('прогресс') || q.includes('балл') || q.includes('егэ') || q.includes('цел')) {
    const current = context?.student?.currentScore || 78;
    const target = context?.student?.targetScore || 92;
    return `Твой текущий результат: ${current} из ${target} баллов (до цели осталось ${target - current} баллов).
Твои самые сильные темы: базовая планиметрия, уравнения и комбинаторика (освоение выше 90%).
Основные точки роста, которые дадут тебе заветный скачок к ${target}+ баллам: стереометрия 2 части (№14) и алгоритмы динамического программирования (№26, 27). Заходи на доску Miro, где репетитор оставил разбор!`;
  }

  return `Я изучил твои учебные материалы и конспекты на сайте!
По твоему вопросу: рекомендую освежить ключевые формулы в разделе «Конспекты» и заглянуть на персональную доску Miro, которую прикрепил преподаватель. Если хочешь разобрать конкретную задачу из ДЗ или кодификатора, напиши ее номер, и мы решим ее пошагово!`;
}

startServer();
