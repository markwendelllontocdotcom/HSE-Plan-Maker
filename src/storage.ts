import { get, set, del, entries } from 'idb-keyval';
import type { Project, Settings } from './model/types';

/** Local storage on this device (IndexedDB). Every call is guarded: storage can be unavailable in private windows. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

export interface PlanInfo { id: string; name: string; code: string; docNo: string; rev: string; date: string; modified: string; created: string }

export const store = {
  loadSettings: () => safe(() => get<Settings>('settings'), undefined),
  saveSettings: (s: Settings) => safe(() => set('settings', s), undefined),
  loadCurrentId: () => safe(() => get<string>('current'), undefined),
  setCurrentId: (id: string) => safe(() => set('current', id), undefined),
  loadProject: (id: string) => safe(() => get<Project>('proj:' + id), undefined),
  async saveProject(p: Project) {
    await safe(() => set('proj:' + p.id, p), undefined);
    await safe(() => set('current', p.id), undefined);
  },
  /** Saves a plan without making it the open one (duplicates, shared plans). */
  putProject: (p: Project) => safe(() => set('proj:' + p.id, p), undefined),
  async snapshot(p: Project) {
    const key = 'snaps:' + p.id;
    const list = (await safe(() => get<{ t: string; p: Project }[]>(key), undefined)) || [];
    list.push({ t: new Date().toISOString(), p });
    while (list.length > 10) list.shift();
    await safe(() => set(key, list), undefined);
  },
  /** Every plan kept on this device, newest first. */
  async listPlans(): Promise<PlanInfo[]> {
    const all = await safe(() => entries<string, any>(), [] as [string, any][]);
    return all
      .filter(([k, v]) => typeof k === 'string' && k.startsWith('proj:') && v && typeof v === 'object')
      .map(([, p]) => ({ id: p.id, name: String(p.P01 || ''), code: String(p.P02 || ''), docNo: String(p.D01 || ''), rev: String(p.D03 || ''), date: String(p.D04 || ''), modified: String(p.modified || ''), created: String(p.created || '') }))
      .sort((a, b) => b.modified.localeCompare(a.modified));
  },
  async removeProject(id: string) {
    await safe(() => del('proj:' + id), undefined);
    await safe(() => del('snaps:' + id), undefined);
  },
  async persist() {
    try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* ignore */ }
  },
};
