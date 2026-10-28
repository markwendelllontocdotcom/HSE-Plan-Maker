import type { Project } from './model/types';
import { APP_NAME, APP_VERSION } from './version';
import { projectFileName, PLAN_EXT } from './model/format';

export const FORMAT = 'hse-plan-maker-project';
const hasPicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
export const isIOS = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function serialise(p: Project): string {
  return JSON.stringify({ format: FORMAT, version: 1, app: `${APP_NAME} ${APP_VERSION}`, saved: new Date().toISOString(), project: p }, null, 1);
}

export function download(bytes: Uint8Array | string, name: string, mime: string) {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export type Handle = any; // FileSystemFileHandle where supported

/** Save to the same file when we have a handle; otherwise ask (Save As) or download. */
export async function saveProjectFile(p: Project, handle: Handle | null, saveAs: boolean, startIn: any = null): Promise<{ handle: Handle | null; name: string } | null> {
  const text = serialise(p);
  const suggested = projectFileName(p);
  if (hasPicker) {
    try {
      let h = handle;
      if (!h || saveAs) {
        const opts: any = { suggestedName: suggested, types: [{ description: 'HSE Plan Maker plan', accept: { 'application/json': [PLAN_EXT] } }] };
        if (startIn) opts.startIn = startIn;
        h = await (window as any).showSaveFilePicker(opts);
      }
      const w = await h.createWritable();
      await w.write(text);
      await w.close();
      return { handle: h, name: h.name };
    } catch (e: any) {
      if (e?.name === 'AbortError') return null;
    }
  }
  download(text, suggested, 'application/json');
  return { handle: null, name: suggested };
}

/** Lets the user pick a file; returns its text (or bytes) with the handle where the browser gives one. */
export async function pickFile(accept: string[], description: string, binary = false): Promise<{ text?: string; bytes?: ArrayBuffer; handle: Handle | null; name: string } | null> {
  const read = async (f: File) => (binary ? { bytes: await f.arrayBuffer() } : { text: await f.text() });
  if (hasPicker && 'showOpenFilePicker' in window) {
    try {
      const [h] = await (window as any).showOpenFilePicker({ types: [{ description, accept: { [binary ? 'application/octet-stream' : 'application/json']: accept } }], excludeAcceptAllOption: false });
      const f = await h.getFile();
      return { ...(await read(f)), handle: binary ? null : h, name: f.name };
    } catch (e: any) {
      if (e?.name === 'AbortError') return null;
    }
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (!isIOS) input.accept = accept.join(',');
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      try { resolve({ ...(await read(f)), handle: null, name: f.name }); } catch (e) { reject(e); }
    };
    input.click();
  });
}

/** Reads an HSE Plan Maker file. */
export function parsePlanFile(text: string, name: string): Project | null {
  let j: any;
  try { j = JSON.parse(text); } catch { throw new Error(`${name} is not an HSE Plan Maker file.`); }
  return j?.format === FORMAT && j.project && typeof j.project === 'object' ? (j.project as Project) : null;
}
