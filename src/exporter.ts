import type { Project, Settings } from './model/types';
import { buildDoc } from './content/build';
import { makeDocx } from './gen/docx';
import { makePdf } from './gen/pdf';
import { browserPlatform } from './platform-browser';
import { outputBaseName } from './model/format';
import { download } from './files';
import { writeToDir } from './exportdir';

export interface Saved { name: string; folder: string | null; pages?: number; note?: string }

/** Writes into the export folder when one is set and writable; otherwise downloads. */
export async function deliver(bytes: Uint8Array, name: string, mime: string, dir: any | null): Promise<Saved> {
  if (dir) {
    try {
      await writeToDir(dir, name, bytes);
      return { name, folder: dir.name };
    } catch (e: any) {
      download(bytes, name, mime);
      const busy = e?.name === 'NoModificationAllowedError' || e?.name === 'InvalidStateError';
      return { name, folder: null, note: busy ? 'The file is open in another program, so it was downloaded instead.' : 'The export folder could not be written, so the file was downloaded instead.' };
    }
  }
  download(bytes, name, mime);
  return { name, folder: null };
}

export async function wordBytes(p: Project, s: Settings): Promise<Uint8Array> {
  const model = await buildDoc(p, s, browserPlatform);
  model.pages = (await pdfFor(p, s)).pageMap; // page numbers for the table of contents fields
  return makeDocx(model);
}

export async function exportWord(p: Project, s: Settings, dir: any | null = null): Promise<Saved> {
  return deliver(await wordBytes(p, s), outputBaseName(p) + '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', dir);
}

export async function exportPdf(p: Project, s: Settings, dir: any | null = null): Promise<Saved> {
  const pdf = await pdfFor(p, s);
  const r = await deliver(pdf.bytes, outputBaseName(p) + '.pdf', 'application/pdf', dir);
  return { ...r, pages: pdf.pages };
}

/** PDFs built recently (Preview, Print, Export PDF, Share reuse them until the plan changes). */
export interface PdfEntry { key: string; bytes: Uint8Array; pages: number; pageMap: Record<string, number>; url: string; built: Date }
const cache: PdfEntry[] = [];
const keyOf = (p: Project) => `${p.id}|${p.modified}`;

export function cachedPdf(p: Project): PdfEntry | null {
  return cache.find((e) => e.key === keyOf(p)) || null;
}

export async function pdfFor(p: Project, s: Settings): Promise<PdfEntry> {
  const hit = cachedPdf(p);
  if (hit) return hit;
  const key = keyOf(p);
  const pdf = await makePdf(await buildDoc(p, s, browserPlatform));
  const e: PdfEntry = { key, bytes: pdf.bytes, pages: pdf.pageCount, pageMap: pdf.pages, url: URL.createObjectURL(new Blob([pdf.bytes as BlobPart], { type: 'application/pdf' })), built: new Date() };
  // keep the latest version of each plan, at most four plans
  for (let i = cache.length - 1; i >= 0; i--) if (cache[i].key.split('|')[0] === p.id) { const old = cache[i].url; setTimeout(() => URL.revokeObjectURL(old), 60000); cache.splice(i, 1); }
  cache.unshift(e);
  while (cache.length > 4) { const old = cache.pop()!; setTimeout(() => URL.revokeObjectURL(old.url), 60000); }
  return e;
}
