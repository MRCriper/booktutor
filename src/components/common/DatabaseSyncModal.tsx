import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Database,
  Download,
  Upload,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Server,
  Layers,
  FileCode,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storage } from '../../services/storage';
import { cloudSync } from '../../services/cloudSync';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const DatabaseSyncModal: React.FC<DatabaseSyncModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'backup' | 'cloud_guide'>('status');
  const [storageSizeKb, setStorageSizeKb] = useState<number>(0);
  const [stats, setStats] = useState({
    homeworks: 0,
    materials: 0,
    tasks: 0,
    students: 0,
    variants: 0,
  });
  const [restoreStatus, setRestoreStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider?: string;
    database?: string;
    tableReady?: boolean;
    lastUpdated?: string | null;
    message?: string;
  } | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    refreshStats();
    checkDbStatus();
  }, [isOpen]);

  const checkDbStatus = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/storage/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      } else {
        setDbStatus({
          connected: false,
          provider: 'unknown',
          message: 'Сервер вернул статус ' + res.status + '. Перезапустите деплой (Redeploy) на Vercel.',
        });
      }
    } catch {
      setDbStatus({
        connected: false,
        provider: 'none',
        message: 'Сервер недоступен или работает в режиме Static SPA без серверных функций.',
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const refreshStats = () => {
    try {
      const hw = storage.getHomeworks();
      const mat = storage.getStudyMaterials();
      const t = storage.getTasks();
      const st = storage.getStudents();
      const v = storage.getExamVariants();

      setStats({
        homeworks: hw.length,
        materials: mat.length,
        tasks: t.length,
        students: st.length,
        variants: v.length,
      });

      // Calculate approximate LocalStorage size
      let totalLength = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalLength += (localStorage[key]?.length || 0) * 2; // UTF-16 bytes
        }
      }
      setStorageSizeKb(Math.round(totalLength / 1024));
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullBackup = () => {
    const json = storage.exportFullBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadBlob(json, `booktutor_full_backup_${dateStr}.json`);
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleExportMaterials = () => {
    const materials = storage.getStudyMaterials();
    downloadBlob(
      JSON.stringify({ materials }, null, 2),
      `booktutor_materials_${new Date().toISOString().split('T')[0]}.json`
    );
  };

  const handleExportHomeworks = () => {
    const homeworks = storage.getHomeworks();
    downloadBlob(
      JSON.stringify({ homeworks }, null, 2),
      `booktutor_homeworks_${new Date().toISOString().split('T')[0]}.json`
    );
  };

  const handleRestoreFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = storage.importFullBackup(text);
      if (res.success) {
        setRestoreStatus({
          success: true,
          message: res.summary || 'Данные успешно восстановлены!',
        });
        refreshStats();
        confetti({ particleCount: 60, spread: 70 });
        onDataRestored?.();
      } else {
        setRestoreStatus({
          success: false,
          message: res.error || 'Ошибка восстановления из файла.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleSyncWithServer = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const ok = await cloudSync.forcePush();
      if (ok) {
        setSyncMessage(`✓ Данные успешно сохранены в Neon Postgres (${new Date().toLocaleTimeString('ru-RU')})`);
        checkDbStatus();
        confetti({ particleCount: 30, spread: 50 });
      } else {
        setSyncMessage('⚠️ Не удалось сохранить в базу. Проверьте подключение к Vercel/Neon.');
      }
    } catch {
      setSyncMessage('⚠️ Ошибка сети при отправке данных в базу.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromDatabase = async () => {
    setIsPulling(true);
    setSyncMessage(null);

    try {
      const ok = await cloudSync.forcePull();
      if (ok) {
        setSyncMessage(`✓ Свежие данные успешно загружены из Neon Postgres!`);
        refreshStats();
        onDataRestored?.();
        confetti({ particleCount: 50, spread: 60 });
      } else {
        setSyncMessage('ℹ️ Данные в вашем браузере уже самые актуальные (новых изменений в базе нет).');
      }
    } catch (e: any) {
      setSyncMessage(`⚠️ Ошибка связи с базой: ${e.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-white dark:bg-[#1A1C24] border border-[#1B1B19] dark:border-[#323642] shadow-2xl flex flex-col max-h-[90vh] text-left"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-white dark:bg-[#1A1C24] border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-2">
                Хранилище данных & База данных (Vercel)
              </h3>
              <p className="text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400">
                Где сохраняются данные, 1-клик бэкап в JSON и подключение облачных БД на Vercel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#1B1B19]/50 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white border border-[#1B1B19]/20 dark:border-[#323642] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 border-b border-[#1B1B19]/15 dark:border-[#323642] flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-[#1B1B19] dark:border-[#E5C048] text-[#1B1B19] dark:text-[#F3F3EE]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" /> Где хранятся данные?
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-[#1B1B19] dark:border-[#E5C048] text-[#1B1B19] dark:text-[#F3F3EE]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19]'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Резервные копии (JSON)
          </button>
          <button
            onClick={() => setActiveTab('cloud_guide')}
            className={`pb-2.5 px-3 border-b-2 font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cloud_guide'
                ? 'border-[#1B1B19] dark:border-[#E5C048] text-[#1B1B19] dark:text-[#F3F3EE]'
                : 'border-transparent text-[#1B1B19]/60 dark:text-gray-400 hover:text-[#1B1B19]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" /> Подключение БД на Vercel
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-mono leading-relaxed">
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Answer to user's question */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-600/30 text-amber-950 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-serif text-sm font-bold text-amber-900 dark:text-amber-100">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  Ответ на вопрос: «Где сейчас хранятся все данные на сайте?»
                </div>
                <p className="font-sans text-xs leading-relaxed">
                  Сейчас все ваши данные — <strong>список учеников</strong>, <strong>выданные домашние задания</strong>,{' '}
                  <strong>прикрепленные фото решений из тетрадей</strong>, <strong>оценки преподавателя</strong>,{' '}
                  <strong>конспекты и формулы</strong>, <strong>банк задач</strong> и <strong>журнал</strong> — сохраняются в{' '}
                  <span className="font-mono font-bold bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 border border-amber-300 dark:border-amber-700">
                    LocalStorage браузера
                  </span>{' '}
                  под вашим доменом на Vercel.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] font-sans">
                  <div className="p-2.5 bg-white/80 dark:bg-[#16181F] border border-amber-300 dark:border-amber-800 space-y-1">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block font-mono">
                      ✓ Преимущества LocalStorage:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>Мгновенный отклик (0 мс, без задержек сети)</li>
                      <li>Работает полностью автономно даже без интернета</li>
                      <li>Абсолютно бесплатно, не требует платных тарифов БД</li>
                      <li>Фотографии и решения хранятся приватно</li>
                    </ul>
                  </div>

                  <div className="p-2.5 bg-white/80 dark:bg-[#16181F] border border-amber-300 dark:border-amber-800 space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block font-mono">
                      ⚠️ Ограничение LocalStorage:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      <li>Данные привязаны к конкретному браузеру</li>
                      <li>При открытии с другого ноутбука или очистке кэша используйте кнопку <strong>«Скачать полный бэкап (JSON)»</strong></li>
                      <li>Либо подключите облачную БД (Postgres / Firebase) для автоматической синхронизации</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Current Metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] uppercase text-[11px]">
                    Текущее состояние хранилища:
                  </span>
                  <span className="text-[#1B1B19]/60 dark:text-gray-400 text-[11px]">
                    Объем в памяти: ~{storageSizeKb} КБ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642]">
                    <span className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 block">Домашние задания</span>
                    <div className="text-lg font-bold text-[#1B1B19] dark:text-[#F3F3EE] mt-0.5">{stats.homeworks}</div>
                  </div>
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642]">
                    <span className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 block">Конспекты и теория</span>
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-0.5">{stats.materials}</div>
                  </div>
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642]">
                    <span className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 block">Банк задач</span>
                    <div className="text-lg font-bold text-amber-700 dark:text-[#E5C048] mt-0.5">{stats.tasks}</div>
                  </div>
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642]">
                    <span className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 block">Ученики</span>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.students}</div>
                  </div>
                  <div className="p-3 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/15 dark:border-[#323642]">
                    <span className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400 block">Варианты КИМ</span>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5">{stats.variants}</div>
                  </div>
                </div>
              </div>

              {/* Cloud Sync Action with Neon Postgres */}
              <div className="p-4 bg-white dark:bg-[#16181F] border border-[#1B1B19]/20 dark:border-[#323642] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Database className={`w-4 h-4 ${dbStatus?.connected ? 'text-emerald-600' : 'text-[#D4AF37]'}`} />
                    <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      Облачная синхронизация Neon Postgres на Vercel
                    </span>
                  </div>
                  <button
                    onClick={checkDbStatus}
                    disabled={isCheckingDb}
                    className="self-start sm:self-auto text-[11px] text-[#1B1B19]/70 dark:text-gray-400 hover:text-[#1B1B19] dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingDb ? 'animate-spin' : ''}`} />
                    {isCheckingDb ? 'Проверка...' : 'Проверить статус связи'}
                  </button>
                </div>

                {/* Connection Status Box */}
                {dbStatus?.connected ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 rounded-none space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      База данных Neon Postgres на Vercel подключена и активна!
                    </div>
                    <div className="text-[11px] font-sans text-emerald-900/80 dark:text-emerald-300/80 flex flex-wrap gap-x-4">
                      <span>База: <strong>{dbStatus.database || 'neon-fuchsia-cave'}</strong></span>
                      <span>Таблица: <strong>booktutor_storage</strong></span>
                      {dbStatus.lastUpdated && (
                        <span>Последний снимок: <strong>{new Date(dbStatus.lastUpdated).toLocaleString('ru-RU')}</strong></span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs space-y-1 font-sans">
                    <div className="flex items-center gap-1.5 font-bold font-mono">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      База Neon создана, но ожидает деплоя серверной функции на Vercel
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                      На вашем Vercel подключена база <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5">neon-fuchsia-cave</code>.
                      Чтобы запросы доходили до нее, выполните <strong>Redeploy</strong> в Vercel Dashboard (вкладка <em>Deployments → ... → Redeploy</em>), чтобы Vercel запустил новую функцию <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5">api/storage/sync.ts</code>.
                    </p>
                  </div>
                )}

                {/* Sync Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleSyncWithServer}
                    disabled={isSyncing}
                    className="p-2.5 bg-[#1B1B19] hover:bg-black text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Upload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                    {isSyncing ? 'Сохранение в Neon...' : 'Отправить в базу (Push)'}
                  </button>

                  <button
                    onClick={handlePullFromDatabase}
                    disabled={isPulling}
                    className="p-2.5 bg-white dark:bg-[#202430] hover:bg-[#F8F7F4] dark:hover:bg-[#2A2E3D] text-[#1B1B19] dark:text-[#F3F3EE] border border-[#1B1B19]/25 dark:border-[#383C4A] font-bold transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
                    {isPulling ? 'Загрузка из Neon...' : 'Загрузить из базы (Pull)'}
                  </button>
                </div>

                {/* Auto-Sync Explanation Card */}
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-blue-200 text-xs flex items-start gap-2.5 font-sans">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ⚡
                  </div>
                  <div className="space-y-0.5 leading-relaxed">
                    <span className="font-bold block font-mono text-[11px]">
                      Умная авто-синхронизация активна:
                    </span>
                    <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80">
                      Вам больше не нужно нажимать кнопки вручную: при любых действиях (выдача ДЗ, оценка с баллами, отправка фото тетрадей учеником, добавление конспекта) изменения автоматически отправляются в Neon Postgres с задержкой 1.8 с (debounce). Все другие ученики и преподаватель получают обновления в фоне при открытии страницы или переключении вкладки!
                    </p>
                  </div>
                </div>

                {syncMessage && (
                  <div className="p-2.5 bg-[#F8F7F4] dark:bg-[#202430] border border-[#1B1B19]/15 dark:border-[#383C4A] text-xs">
                    {syncMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200">
                <strong>Резервная копия всей системы в 1 клик (JSON):</strong>
                <p className="font-sans text-xs mt-0.5">
                  Вы можете скачать полный дамп всех ваших данных в формате JSON, хранить его на флешке/диске и переносить сайт на любой компьютер или домен за пару секунд.
                </p>
              </div>

              {/* Export Buttons */}
              <div className="space-y-2">
                <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] uppercase text-[11px] block">
                  Экспорт данных в JSON:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleExportFullBackup}
                    className="p-3.5 bg-white dark:bg-[#16181F] border border-[#1B1B19] dark:border-[#323642] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-left transition space-y-1 cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-[#D4AF37]" /> Полная база (Всё)
                      </span>
                      <span className="text-[10px] text-[#D4AF37] opacity-0 group-hover:opacity-100 transition">↓</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                      Ученики, ДЗ с фото, конспекты, задачи и журнал
                    </p>
                  </button>

                  <button
                    onClick={handleExportMaterials}
                    className="p-3.5 bg-white dark:bg-[#16181F] border border-[#1B1B19]/25 dark:border-[#323642] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-left transition space-y-1 cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <FileCode className="w-4 h-4 text-purple-600" /> Только теория & конспекты
                      </span>
                      <span className="text-[10px] text-purple-600 opacity-0 group-hover:opacity-100 transition">↓</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                      Все конспекты, формулы LaTeX и шпаргалки ({stats.materials} шт)
                    </p>
                  </button>

                  <button
                    onClick={handleExportHomeworks}
                    className="p-3.5 bg-white dark:bg-[#16181F] border border-[#1B1B19]/25 dark:border-[#323642] hover:bg-[#F8F7F4] dark:hover:bg-[#202430] text-left transition space-y-1 cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" /> Только домашние задания
                      </span>
                      <span className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition">↓</span>
                    </div>
                    <p className="font-sans text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                      Журнал ДЗ, решения учеников и оценки ({stats.homeworks} шт)
                    </p>
                  </button>
                </div>
              </div>

              {/* Import Restore */}
              <div className="p-4 bg-[#F8F7F4] dark:bg-[#16181F] border border-[#1B1B19]/20 dark:border-[#323642] space-y-3">
                <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE] uppercase text-[11px] block">
                  Восстановление базы из файла бэкапа:
                </span>
                <label className="border-2 border-dashed border-[#1B1B19]/30 dark:border-[#383C4A] hover:border-[#1B1B19] dark:hover:border-[#E5C048] p-5 text-center flex flex-col items-center justify-center gap-2 bg-white dark:bg-[#121316] cursor-pointer transition">
                  <Upload className="w-6 h-6 text-[#D4AF37]" />
                  <span className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                    Выберите файл booktutor_full_backup_*.json
                  </span>
                  <span className="text-[11px] text-[#1B1B19]/60 dark:text-gray-400">
                    Система моментально распакует и восстановит все данные сайта
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleRestoreFromFile}
                    className="hidden"
                  />
                </label>

                {restoreStatus && (
                  <div
                    className={`p-3 border text-xs flex items-center gap-2 ${
                      restoreStatus.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                    }`}
                  >
                    {restoreStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{restoreStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cloud_guide' && (
            <div className="space-y-4 font-sans text-xs">
              {/* Highlight specifically for user's screenshot */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <strong className="font-mono text-sm">
                    Ваша база данных на Vercel: neon-fuchsia-cave (Neon Free)
                  </strong>
                </div>
                <p className="leading-relaxed text-xs">
                  Вы всё настроили в Vercel правильно: база данных создана и подключена к проекту <strong>booktutor</strong> (состояние <em>Available</em> на вашем скриншоте).
                </p>

                <div className="p-3 bg-white/90 dark:bg-[#16181F] border border-emerald-300/60 dark:border-emerald-700/60 space-y-2 text-xs">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 font-mono">
                    Почему ранее сайт выдавал «Сервер в режиме статики»?
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                    На Vercel проект собирался как статичный SPA: в коде не было Serverless-функции в папке <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5">/api/storage/sync.ts</code>, а файл <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5">vercel.json</code> перенаправлял все запросы на <code>index.html</code>.
                  </p>
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 font-mono pt-1">
                    Что мы только что исправили в коде:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 font-sans">
                    <li>Создали серверную функцию <code className="bg-gray-100 dark:bg-gray-800 px-1">/api/storage/sync.ts</code> для сохранения и загрузки данных через <code>@neondatabase/serverless</code>.</li>
                    <li>Добавили эндпоинт проверки статуса <code className="bg-gray-100 dark:bg-gray-800 px-1">/api/storage/status.ts</code>.</li>
                    <li>Исправили <code className="bg-gray-100 dark:bg-gray-800 px-1">vercel.json</code>, чтобы роуты <code>/api/*</code> не перехватывались статичным HTML.</li>
                    <li>Таблица <code>booktutor_storage</code> создается автоматически при первом запросе и хранит всех учеников, ДЗ с прикрепленными фото, конспекты и журнал.</li>
                  </ul>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 font-mono">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Что сделать прямо сейчас, чтобы всё заработало:
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 font-sans text-[11px] text-amber-900/90 dark:text-amber-200/90">
                    <li>
                      Зайдите в ваш проект в Vercel: <a href="https://vercel.com/mxakerov-yandex-ru/booktutor/deployments" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700 dark:text-blue-300">Вкладка Deployments</a>.
                    </li>
                    <li>
                      У самого верхнего деплоя нажмите справа кнопку с тремя точками <strong>...</strong> и выберите <strong>Redeploy</strong> (или отправьте коммит в GitHub).
                    </li>
                    <li>
                      Дождитесь окончания сборки (30-60 секунд). Vercel автоматически передаст в проект переменную <code>POSTGRES_URL</code> от вашей базы <code>neon-fuchsia-cave</code>.
                    </li>
                    <li>
                      Откройте сайт и нажмите во вкладке «Где хранятся данные?» кнопку <strong>«Отправить в базу (Push)»</strong>. Статус станет зеленым: <em>«База данных Neon Postgres подключена и активна!»</em>.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Architecture info */}
              <div className="p-4 bg-white dark:bg-[#16181F] border border-[#1B1B19]/20 dark:border-[#323642] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <h4 className="font-serif text-sm font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
                      Гибридная архитектура BookTutor Pro (Local + Cloud)
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold">
                    Zero-latency + Cloud Sync
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
                  Все данные хранятся локально в браузере для мгновенного отклика (0 мс) и полной работы без сети, а через Neon Postgres репетитор и ученики синхронизируют конспекты, решения с фото и оценки между любыми устройствами в 1 клик.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#F8F7F4] dark:bg-[#1A1C24] border-t border-[#1B1B19]/15 dark:border-[#323642] flex items-center justify-between shrink-0 font-mono text-xs">
          <div className="text-[#1B1B19]/60 dark:text-gray-400">
            Платформа BookTutor Pro • Vercel Ready
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1B1B19] text-[#F8F7F4] dark:bg-[#E5C048] dark:text-[#121316] font-bold uppercase tracking-wider hover:bg-black cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </div>
  );
};
