import { createStore, get as kget, set as kset, del as kdel, entries as kentries } from 'idb-keyval';
import type { Project, Settings } from './model/types';

/**
 * HSE Plan Maker keeps its plans in its own database on the device ("hse-plan-maker").
 * Up to 1.0.5 it used idb-keyval's default database, which PQP Maker also uses: the two apps share one origin
 * (markwendelllontocdotcom.github.io for the web versions, file:// for the single-file copies), so My HSE Plans
 * listed PQP projects and each app's "current" could open the other's. moveFromShared() copies the HSE plans across once.
 */
export const db = createStore('hse-plan-maker', 'keyval');
const get = <T = any>(k: string) => kget<T>(k, db);
const set = (k: string, v: any) => kset(k, v, db);
const del = (k: string) => kdel(k, db);
const entries = <K extends IDBValidKey = IDBValidKey, V = any>() => kentries<K, V>(db);

/** An HSE plan, as opposed to a PQP Maker project (both are kept under proj:<id> in the shared database). */
const isHsePlan = (v: any) => !!v && typeof v === 'object' && Array.isArray(v.POL) && Array.isArray(v.S01) && 'T02' in v;

/** Once: copies the HSE plans (and their snapshots, the open plan and the export folder) from the shared database.
 *  PQP Maker's projects are left where they are; if PQP Maker's "current" was an HSE plan it goes back to its latest project. */
export async function moveFromShared(): Promise<number> {
  try {
    if (await get('movedFromShared')) return 0;
    const all = await kentries<IDBValidKey, any>();
    const byKey = new Map<string, any>(all.filter(([k]) => typeof k === 'string') as [string, any][]);
    const ids = [...byKey.entries()].filter(([k, v]) => k.startsWith('proj:') && isHsePlan(v)).map(([k]) => k.slice(5));
    for (const id of ids) {
      if (!(await get('proj:' + id))) await set('proj:' + id, byKey.get('proj:' + id));
      const snaps = byKey.get('snaps:' + id);
      if (snaps && !(await get('snaps:' + id))) await set('snaps:' + id, snaps);
    }
    const cur = byKey.get('current');
    if (typeof cur === 'string' && ids.includes(cur)) {
      await set('current', cur);
      // PQP Maker opens its own latest project again
      const recent = byKey.get('recent');
      const back = Array.isArray(recent) ? recent.map((r: any) => r && r.id).find((x: any) => typeof x === 'string' && byKey.has('proj:' + x) && !ids.includes(x)) : undefined;
      if (back) await kset('current', back); else await kdel('current');
    }
    for (const k of ['exportDir', 'exportDirAsked']) if (byKey.has(k) && (await get(k)) === undefined) await set(k, byKey.get(k));
    await set('movedFromShared', new Date().toISOString());
    return ids.length;
  } catch { return 0; }
}

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
