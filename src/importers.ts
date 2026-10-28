import JSZip from 'jszip';
import type { Project, ImageData, Person } from './model/types';
import { EMIRATES, DISCIPLINES, ROLES, codeForEmirate, chaptersFor, codeHeading } from './model/defaults';
import { PROJECT_CODE, PROJECT_CODE_MAX } from './model/format';

/**
 * Project details from the other Oxypro tools, so every submission uses the same project information:
 *  - the file the Oxypro Project Library saves with its HSE button ("Save HSE Plan file": <code> - <name> - HSE Plan details.json,
 *    with the chosen cover photo) or under QA/QC > "PQP details and file" (.pqp.json), or a PQP Maker project (.pqp)
 *  - the link the Library makes ("Open in HSE Plan Maker" / "Open in PQP Maker": #library=<deflate-raw base64url JSON>)
 *  - the Excel "Oxypro - Projects Master List" (sheet OXYPRO PROJECT MASTER CASE, headers on row 3)
 *  - another HSE plan (its project details only)
 * Only project details are taken. People, document control, lists and policies stay as they are in the HSE plan.
 */
export type Incoming = { fields: Partial<Project>; source: string; label: string; photo?: boolean };

/** Fields an import can fill, in form order, with their labels (for the dialogs). */
export const IMPORT_LABELS: Record<string, string> = {
  P01: 'Project Name', P02: 'Project Code & Number', P04: 'Emirate', P05: 'Plot No. / Address', P07: 'Scope of MEP Works', P08: 'Disciplines',
  P13: 'Building Configuration', R01: 'Client', R02: 'Lead Consultant', R02m: 'MEP Consultant', R03: 'Main Contractor', R04: 'MEP Contractor',
  R05: 'Our Role', R07: 'Client Logo', R08: 'Consultant Logo', R10: 'Cover Photo', K01: 'Projects Director', K02: 'Project Manager', K04: 'Project HSE Manager',
};
export const PROJECT_KEYS = Object.keys(IMPORT_LABELS);

const MAX: Record<string, number> = { P01: 150, P05: 300, P07: 2000, P13: 500 };
const EMIRATE_CODES: Record<string, string> = { DXB: 'Dubai', AUH: 'Abu Dhabi', SHJ: 'Sharjah', AJM: 'Ajman', RAK: 'Ras Al Khaimah', FUJ: 'Fujairah', UAQ: 'Umm Al Quwain', AD: 'Abu Dhabi' };

export function emirateOf(v: unknown): string | undefined {
  const s = String(v ?? '').trim();
  if (!s) return undefined;
  const hit = EMIRATES.find((e) => e.toLowerCase() === s.toLowerCase());
  return hit || EMIRATE_CODES[s.toUpperCase()];
}
const str = (v: unknown, max = 200) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max) : '');
const code = (v: unknown) => { const c = str(v).toUpperCase(); return c && c.length <= PROJECT_CODE_MAX && PROJECT_CODE.test(c) ? c : ''; };
const naOrEmpty = (s: string) => !s || /^(n\/?a|na|-|nil|none)$/i.test(s.trim());
const person = (x: any): Person | null => (x && typeof x.name === 'string' && x.name.trim() ? { name: x.name.trim().slice(0, 120), email: str(x.email, 120), phone: str(x.phone, 60) } : null);
function image(x: any): ImageData | null {
  if (!x || typeof x.dataUrl !== 'string' || !/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(x.dataUrl) || x.dataUrl.length > 9_000_000) return null;
  const im: ImageData = { name: str(x.name, 120) || 'Image.jpg', type: x.dataUrl.slice(5, x.dataUrl.indexOf(';')), dataUrl: x.dataUrl };
  if (+x.w > 0 && +x.h > 0) { im.w = Math.round(+x.w); im.h = Math.round(+x.h); }
  return im;
}

/** Project details from a PQP Maker / Library project object (format pqp-maker-project). */
export function fromPqp(x: any): Partial<Project> {
  const out: any = {};
  for (const k of ['P01', 'P05', 'P07', 'P13', 'R01', 'R02', 'R03', 'R04']) { const v = str(x[k], MAX[k] || 200); if (v) out[k] = v; }
  // MEP Consultant (the Library's HSE file and links send it when it is a different firm from the Lead Consultant)
  const mep = str(x.R02m);
  const bare = (v: string) => v.replace(/^\s*M\/s\.?\s*/i, '').trim().toLowerCase();
  if (mep && !naOrEmpty(mep) && bare(mep) !== bare(out.R02 || '')) out.R02m = mep;
  const c = code(x.P02); if (c) out.P02 = c;
  const e = emirateOf(x.P04); if (e) out.P04 = e;
  if (Array.isArray(x.P08)) { const l = x.P08.filter((d: any) => DISCIPLINES.includes(d)); if (l.length) out.P08 = l; }
  if (ROLES.includes(x.R05)) out.R05 = x.R05;
  for (const k of ['R07', 'R08', 'R10']) { const im = image(x[k]); if (im) out[k] = im; }
  const pm = person(x.K01); if (pm) out.K02 = pm;           // PQP K01 Project Manager
  const pd = person(x.K07); if (pd) out.K01 = pd;           // PQP K07 Projects Director
  const others = [...(Array.isArray(x.K06) ? x.K06 : []), ...(x.K04 ? [{ ...x.K04, role: 'HSE Manager' }] : [])];
  const hse = others.find((o: any) => /hse\s*manager/i.test(o?.role || ''));
  const hm = person(hse); if (hm) out.K04 = hm;
  return out;
}

/** Project details of another HSE plan. */
export function fromHse(x: any): Partial<Project> {
  const out: any = fromPqp({ ...x, K01: undefined, K07: undefined, K06: undefined });
  const m = str(x.R02m); if (m) out.R02m = m;
  for (const k of ['K01', 'K02', 'K04']) { const pp = person(x[k]); if (pp) out[k] = pp; }
  return out;
}

/** Reads a dropped / opened file's text as a project from any of the Oxypro tools. */
export function parseProjectText(text: string, name = 'file'): Incoming {
  let j: any;
  try { j = JSON.parse(text); } catch { throw new Error(`${name} is not a project file.`); }
  if (j?.format === 'pqp-maker-project' && j.project) {
    const lib = j.source?.library;
    return { fields: fromPqp(j.project), source: lib ? 'Oxypro Project Library' : 'PQP Maker', label: name, photo: j.source?.photo === 'clipboard' };
  }
  if (j?.format === 'hse-plan-maker-project' && j.project) return { fields: fromHse(j.project), source: 'HSE Plan', label: name };
  throw new Error(`${name} is not a PQP Maker, Project Library or HSE Plan Maker file.`);
}

// ------------------------------------------------------------------ links (#library= from the Library, #hse= shared plans)
function fromBase64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}
export function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function inflate(bytes: Uint8Array): Promise<string> {
  const DS = (globalThis as any).DecompressionStream;
  if (!DS) throw new Error('This browser cannot read the link. Use Edge or Chrome, or save the file in the Library and import it here.');
  return await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(new DS('deflate-raw'))).text();
}
export async function deflate(text: string): Promise<Uint8Array | null> {
  const CS = (globalThis as any).CompressionStream;
  if (!CS) return null;
  return new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CS('deflate-raw'))).arrayBuffer());
}

export const hasLibraryHash = (h: string) => /#library(-json)?=/.test(h || '');
export const hasShareHash = (h: string) => /#hse(-json)?=/.test(h || '');

/** Reads #library= / #library-json= (the PQP Maker link the Library makes) from a link or hash. */
export async function readLibraryLink(link: string): Promise<Incoming> {
  const m = (link || '').match(/#library(-json)?=([A-Za-z0-9_-]+)/);
  if (!m) throw new Error('This is not a link from the Oxypro Project Library. In the Library, open the project and use HSE > Open in HSE Plan Maker, or QA/QC > PQP details and file > copy the "Open in PQP Maker" link.');
  let text: string;
  try { const bytes = fromBase64Url(m[2]); text = m[1] ? new TextDecoder().decode(bytes) : await inflate(bytes); }
  catch (e: any) { throw new Error(e?.message && /browser/.test(e.message) ? e.message : 'The link could not be read. Copy it again from the Library.'); }
  const r = parseProjectText(text, 'Library link');
  return { ...r, source: 'Oxypro Project Library', label: r.fields.P01 || 'Library project' };
}

// ------------------------------------------------------------------ Projects Master List (.xlsx)
export interface MasterRow { no: string; fields: Partial<Project>; status: string; emirate: string }

const unxml = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&amp;/g, '&');
const colIndex = (ref: string) => { const l = ref.replace(/\d+/g, ''); let n = 0; for (const ch of l) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** All rows of every sheet as text grids (cells as displayed text; numbers as written). */
export async function readXlsx(bytes: Uint8Array | ArrayBuffer): Promise<{ name: string; rows: string[][] }[]> {
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(bytes); } catch { throw new Error('This is not an Excel workbook (.xlsx).'); }
  const wb = await zip.file('xl/workbook.xml')?.async('string');
  if (!wb) throw new Error('This is not an Excel workbook (.xlsx).');
  const rels = (await zip.file('xl/_rels/workbook.xml.rels')?.async('string')) || '';
  const ssXml = (await zip.file('xl/sharedStrings.xml')?.async('string')) || '';
  const shared = [...ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => unxml(t[1])).join(''));
  const target: Record<string, string> = {};
  for (const m of rels.matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) target[m[1]] = m[2];
  for (const m of rels.matchAll(/<Relationship [^>]*Target="([^"]+)"[^>]*Id="([^"]+)"/g)) target[m[2]] = m[1];
  const out: { name: string; rows: string[][] }[] = [];
  for (const m of wb.matchAll(/<sheet [^>]*>/g)) {
    const tag = m[0];
    const name = unxml((/name="([^"]*)"/.exec(tag) || [])[1] || '');
    if (/state="(hidden|veryHidden)"/.test(tag)) continue;
    const rid = (/r:id="([^"]+)"/.exec(tag) || [])[1];
    let t = target[rid] || '';
    t = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
    const xml = await zip.file(t)?.async('string');
    if (!xml) continue;
    const rows: string[][] = [];
    for (const rm of xml.matchAll(/<row [^>]*?r="(\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const r = +rm[1] - 1;
      const cells: string[] = [];
      for (const cm of (rm[2] || '').matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = cm[1];
        const ref = (/r="([A-Z]+\d+)"/.exec(attrs) || [])[1];
        if (!ref) continue;
        const ty = (/t="(\w+)"/.exec(attrs) || [])[1];
        const inner = cm[2] || '';
        let v = '';
        if (ty === 's') v = shared[+((/<v>([\s\S]*?)<\/v>/.exec(inner) || [])[1] || -1)] ?? '';
        else if (ty === 'inlineStr') v = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => unxml(x[1])).join('');
        else v = unxml((/<v>([\s\S]*?)<\/v>/.exec(inner) || [])[1] || '');
        cells[colIndex(ref)] = v;
      }
      rows[r] = Array.from(cells, (c) => c ?? '');
    }
    out.push({ name, rows: Array.from(rows, (r) => r || []) });
  }
  return out;
}

/** Header name variants of the Master List columns. */
const COLS: Record<string, string[]> = {
  no: ['oxyproprojectno', 'projectno', 'oxyprono'],
  code: ['projectcode'],
  name: ['projectbuildingname', 'projectname', 'buildingname'],
  levels: ['levelfloornounitno', 'levelfloorno', 'levelfloornounitno2', 'levels', 'buildingconfiguration'],
  area: ['area', 'location', 'plotnoaddress'],
  emirate: ['emirate'],
  mc: ['maincontractor'],
  mep: ['mepconsultant'],
  lead: ['leadconsultant', 'consultant'],
  client: ['clientsname', 'clientname', 'client'],
  scope: ['scopeofwork', 'scopeofworks'],
  status: ['projectstatus', 'status'],
};

/** The projects of the Oxypro Projects Master List workbook. */
export async function readMasterList(bytes: Uint8Array | ArrayBuffer): Promise<MasterRow[]> {
  const sheets = await readXlsx(bytes);
  const ordered = [...sheets.filter((s) => /master\s*case/i.test(s.name) && !/updated/i.test(s.name)), ...sheets];
  for (const sh of ordered) {
    const hi = sh.rows.slice(0, 12).findIndex((r) => r.some((c) => COLS.name.includes(norm(c))));
    if (hi < 0) continue;
    const head = sh.rows[hi].map(norm);
    const col: Record<string, number> = {};
    for (const [k, names] of Object.entries(COLS)) col[k] = head.findIndex((h) => names.includes(h));
    const get = (r: string[], k: string) => (col[k] >= 0 ? String(r[col[k]] ?? '').trim() : '');
    const out: MasterRow[] = [];
    for (const r of sh.rows.slice(hi + 1)) {
      const name = get(r, 'name');
      if (!name) continue;
      const no = get(r, 'no');
      const f: any = { P01: name.slice(0, 150) };
      const c = code(get(r, 'code')) || code(no);
      if (c) f.P02 = c;
      const emi = emirateOf(get(r, 'emirate'));
      if (emi) f.P04 = emi;
      const area = get(r, 'area').replace(/,?\s*(dubai|abu dhabi|sharjah|ajman|ras al khaimah|fujairah|umm al quwain)?\s*,?\s*(uae|united arab emirates)?\s*$/i, '').trim();
      if (area) f.P05 = area.slice(0, 300);
      const lv = get(r, 'levels'); if (lv) f.P13 = lv.slice(0, 500);
      const sc = get(r, 'scope'); if (sc) f.P07 = sc.slice(0, 2000);
      const cl = get(r, 'client'); if (!naOrEmpty(cl)) f.R01 = cl.slice(0, 200);
      const mc = get(r, 'mc'); if (!naOrEmpty(mc)) f.R03 = mc.slice(0, 200);
      const lead = get(r, 'lead'), mep = get(r, 'mep');
      if (!naOrEmpty(lead)) { f.R02 = lead.slice(0, 200); if (!naOrEmpty(mep)) f.R02m = mep.slice(0, 200); }
      else if (!naOrEmpty(mep)) f.R02 = mep.slice(0, 200);
      out.push({ no, fields: f, status: get(r, 'status'), emirate: emi || get(r, 'emirate') });
    }
    if (out.length) return out;
  }
  throw new Error('No projects were found. Choose the "Oxypro - Projects Master List" workbook (sheet OXYPRO PROJECT MASTER CASE, headers on row 3).');
}

/** The cover photo pasted after Open in HSE Plan Maker in the Library (the link carries the text only): JPEG, at most 2000 px. */
export async function coverFromBlob(b: Blob, projectName: string): Promise<ImageData> {
  const url = URL.createObjectURL(b);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('This is not a photo the app can read.')); i.src = url; });
    const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext('2d')!; g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
    const base = (projectName || 'Project').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 80);
    return { name: `${base} - Cover Photo.jpg`, type: 'image/jpeg', dataUrl: c.toDataURL('image/jpeg', 0.86), w: c.width, h: c.height };
  } finally { URL.revokeObjectURL(url); }
}

/** Lays imported project details over a plan. A plan already started keeps its own photo and logos unless the import brings them. */
export function applyImport(base: Project, f: Partial<Project>): Project {
  const n: any = { ...base, modified: new Date().toISOString() };
  for (const k of PROJECT_KEYS) if ((f as any)[k] != null) n[k] = (f as any)[k];
  // the cover signatures follow the people, as when they are typed (Initiated / Reviewed / Approved By)
  for (const [d, k] of [['D06', 'K04'], ['D08', 'K02'], ['D10', 'K01']] as const) {
    const was = (base as any)[k]?.name || '';
    if ((f as any)[k] && (!(base as any)[d] || (base as any)[d] === was)) n[d] = (f as any)[k].name;
  }
  // Abu Dhabi uses OSHAD-SF: the code column follows the emirate while its chapters are still the defaults
  if (f.P04) {
    const had = codeForEmirate(base.P04), want = codeForEmirate(f.P04);
    if (want !== had && base.C01 === had && JSON.stringify(base.CHAP) === JSON.stringify(chaptersFor(had))) { n.C01 = want; n.C01name = codeHeading(want); n.CHAP = chaptersFor(want); }
  }
  return n as Project;
}

/** True when nothing has been typed into the plan yet. */
export const isBlankPlan = (p: Project) => !p.P01.trim() && !p.P02.trim() && !p.R01.trim() && !p.R03.trim();
