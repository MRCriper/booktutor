import { storage } from './storage';

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncInfo {
  status: CloudSyncStatus;
  lastSyncedAt: Date | null;
  message: string;
  isOnline: boolean;
}

type SyncListener = (info: SyncInfo) => void;

const LAST_UPDATED_KEY = 'booktutor_cloud_last_updated';

class CloudSyncService {
  private status: CloudSyncStatus = 'idle';
  private lastSyncedAt: Date | null = null;
  private message: string = 'Готов к синхронизации';
  private lastServerUpdatedAt: string | null = null;
  private isApplyingRemoteUpdate = false;
  private isSyncing = false;
  private debounceTimer: any = null;
  private pollingInterval: any = null;
  private listeners: Set<SyncListener> = new Set();
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.lastServerUpdatedAt = localStorage.getItem(LAST_UPDATED_KEY);
      } catch {
        // ignore
      }
    }
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Listen to online/offline network events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notify();
      this.pullUpdates(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.status = 'offline';
      this.message = 'Нет интернет-соединения (работа в LocalStorage)';
      this.notify();
    });

    // Listen to all local storage modifications across the app
    storage.subscribe(() => {
      if (this.isApplyingRemoteUpdate) {
        return;
      }
      this.schedulePush(1800);
    });

    // Smart background updates:
    // 1. Initial lazy pull on app load
    setTimeout(() => {
      this.pullUpdates(true);
    }, 800);

    // 2. Pull when student/tutor switches tabs or focuses the browser window
    window.addEventListener('focus', () => {
      this.pullUpdates(true);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pullUpdates(true);
      }
    });

    // 3. Gentle heartbeat polling (every 25 seconds) - only when tab is visible
    this.pollingInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.pullUpdates(true);
      }
    }, 25000);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getInfo());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const info = this.getInfo();
    this.listeners.forEach((fn) => fn(info));
  }

  public getInfo(): SyncInfo {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      message: this.message,
      isOnline: this.isOnline,
    };
  }

  /**
   * Debounced push: groups rapid edits (e.g. typing notes, uploading photos, assigning homework)
   * into a single clean network request to avoid unnecessary database hits.
   */
  public schedulePush(delayMs = 1800) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.status = 'syncing';
    this.message = 'Сохранение изменений в базу...';
    this.notify();

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.pushLocalChanges();
    }, delayMs);
  }

  /**
   * Pushes the current LocalStorage snapshot to Neon Postgres via /api/storage/sync
   */
  public async pushLocalChanges(): Promise<boolean> {
    if (this.isApplyingRemoteUpdate) return false;
    if (!navigator.onLine) {
      this.status = 'offline';
      this.message = 'Офлайн (сохранено в браузере)';
      this.notify();
      return false;
    }

    this.isSyncing = true;
    this.status = 'syncing';
    this.message = 'Отправка в Neon Postgres...';
    this.notify();

    try {
      const payload = storage.exportFullBackup();
      const res = await fetch('/api/storage/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      if (res.ok) {
        const json = await res.json();
        const serverTime = json.updatedAt || json.timestamp || new Date().toISOString();
        this.lastServerUpdatedAt = serverTime;
        try {
          localStorage.setItem(LAST_UPDATED_KEY, serverTime);
        } catch {
          // ignore
        }

        this.status = 'synced';
        this.lastSyncedAt = new Date();
        this.message = 'Все изменения сохранены в Neon Postgres';
        this.notify();
        return true;
      } else {
        const errJson = await res.json().catch(() => null);
        this.status = 'error';
        this.message = errJson?.message || 'Ошибка сохранения в облако';
        this.notify();
        return false;
      }
    } catch (err: any) {
      this.status = 'error';
      this.message = 'Ошибка сети при отправке в базу';
      this.notify();
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pulls remote changes.
   * If isLightweight is true, passes ?since=... so the server only returns { modified: false }
   * if no new data was written, saving bandwidth, RAM, and DB connections!
   */
  public async pullUpdates(isLightweight = true): Promise<boolean> {
    // Don't pull if local changes are pending in debounce (user is actively editing)
    if (this.debounceTimer || this.isSyncing || this.isApplyingRemoteUpdate) {
      return false;
    }
    if (!navigator.onLine) {
      this.status = 'offline';
      return false;
    }

    this.isSyncing = true;
    try {
      let url = '/api/storage/sync';
      if (isLightweight && this.lastServerUpdatedAt) {
        url += `?since=${encodeURIComponent(this.lastServerUpdatedAt)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        // If 404/503 (e.g. database empty or server starting up), don't treat as fatal error
        return false;
      }

      const json = await res.json();

      // Database hasn't changed since our last check! (Zero overhead)
      if (json.modified === false) {
        if (this.status !== 'synced') {
          this.status = 'synced';
          this.notify();
        }
        return false;
      }

      // New data available! Apply to LocalStorage seamlessly
      const payload = json.data;
      if (payload && typeof payload === 'object') {
        this.isApplyingRemoteUpdate = true;
        storage.importFullBackup(JSON.stringify(payload));
        this.isApplyingRemoteUpdate = false;

        const serverTime = json.updatedAt || new Date().toISOString();
        this.lastServerUpdatedAt = serverTime;
        try {
          localStorage.setItem(LAST_UPDATED_KEY, serverTime);
        } catch {
          // ignore
        }

        this.status = 'synced';
        this.lastSyncedAt = new Date();
        this.message = 'Данные синхронизированы с облаком';
        this.notify();
        return true;
      }

      return false;
    } catch {
      // Background poll failure is silent
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Force instant push right now (bypasses debounce)
   */
  public async forcePush(): Promise<boolean> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    return this.pushLocalChanges();
  }

  /**
   * Force full pull right now (fetches full payload regardless of timestamp)
   */
  public async forcePull(): Promise<boolean> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    return this.pullUpdates(false);
  }
}

export const cloudSync = new CloudSyncService();
