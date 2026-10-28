import pdfMakeLib from 'pdfmake/build/pdfmake';
import vfsJson from '../fonts/vfs.json';
import type { Block, DocModel, Run, Row, Cell } from './model';
import { PAGE, CONTENT_W, NAVY, COVER_BOX } from './model';
import { assetDataUrl } from '../content/svgs';
import { APP_NAME } from '../version';

const pdfMake: any = (pdfMakeLib as any).default || pdfMakeLib;
export const FONTS = {
  Carlito: { normal: 'Carlito-Regular.ttf', bold: 'Carlito-Bold.ttf', italics: 'Carlito-Italic.ttf', bolditalics: 'Carlito-BoldItalic.ttf' },
  Symbols: { normal: 'Symbols.ttf', bold: 'Symbols.ttf', italics: 'Symbols.ttf', bolditalics: 'Symbols.ttf' },
};
const pt = (tw: number) => tw / 20;
/** hyphens inside words become non-breaking so justified lines do not open a gap after them */
const nbh = (t: string) => t.replace(/(?<=[A-Za-z0-9])-(?=[A-Za-z0-9])/g, '‑');
const SYMBOL_LABELS = new Set(['➢', '▪', '✓']);
const H_PT = 841.89;
/** headlineLevel of a block that starts a new page: the break is made only when it is not already at the top of a page */
const NEW_PAGE = 5;
const TOP_PT = PAGE.top / 20;

function inl(r: Run, defSz: number, extra: any = {}): any {
  const o: any = { text: nbh(r.x.replace(/\t+/g, '    ')), fontSize: (r.sz || defSz) / 2, ...extra };
  if (r.b) o.bold = true;
  if (r.i) o.italics = true;
  if (r.u) o.decoration = 'underline';
  if (r.c && r.c !== 'auto') o.color = '#' + r.c;
  return o;
}
const inls = (rs: Run[], sz: number, extra: any = {}) => rs.map((r) => inl(r, sz, extra));
const markId = (marks?: string[]) => (marks && marks.length ? 'mk:' + marks.join('|') : undefined);

function cellNode(c: Cell, sz: number, mark = false, lastId?: string): any {
  const paras = c.p.length ? c.p : [{ r: [] }];
  const stack = paras.map((cp, pi) => {
    const t = inls(cp.r.map((r) => ({ ...r, b: (r.b || c.bold ? 1 : undefined) as 1 | undefined, c: c.color || r.c })), sz);
    const node: any = { text: t.length ? t : ' ', alignment: cp.jc === 'center' ? 'center' : cp.jc === 'right' ? 'right' : cp.jc === 'both' ? 'justify' : 'left', margin: [0, 1, 0, 1] };
    if (mark) node.headlineLevel = 2;
    if (lastId && pi === paras.length - 1) node.id = lastId;
    if (cp.li) return { columns: [{ width: 10, text: '•', fontSize: sz / 2, headlineLevel: mark ? 2 : undefined }, { width: '*', ...node }], columnGap: 2, headlineLevel: mark ? 2 : undefined };
    return node;
  });
  const o: any = { stack };
  if (mark) o.headlineLevel = 2;
  if (c.fill) o.fillColor = '#' + c.fill;
  if (c.span && c.span > 1) o.colSpan = c.span;
  if (c.va === 'center') o.verticalAlignment = 'middle';
  return o;
}

/** Short tables (up to 15 rows) are kept on one page: the table node is level 3 and its cells level 2. */
function tableNode(t: { grid: number[]; rows: Row[]; jc?: string; ind?: number; sz?: number; mark?: string[] }, borders = true): any {
  const sz = t.sz || 20;
  const small = t.rows.length <= 15;
  const id = markId(t.mark);
  const body: any[][] = t.rows.map((r, ri) => {
    const cells: any[] = [];
    r.c.forEach((c, ci) => {
      cells.push(cellNode(c, sz, small, ri === t.rows.length - 1 && ci === 0 ? id : undefined));
      for (let i = 1; i < (c.span || 1); i++) cells.push({});
    });
    return cells;
  });
  const headerRows = t.rows.findIndex((r) => !r.header);
  const tbl: any = {
    headlineLevel: small ? 3 : undefined,
    table: { widths: t.grid.map((g) => pt(g) - 8.5), body, headerRows: headerRows > 0 ? headerRows : 0, dontBreakRows: !small, heights: t.rows.map((r) => (r.minH ? pt(r.minH) : 'auto')) },
    layout: borders
      ? { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#000000', vLineColor: () => '#000000', paddingLeft: () => 4.25, paddingRight: () => 4.25, paddingTop: () => 1.5, paddingBottom: () => 1.5 }
      : 'noBorders',
    margin: [0, 2, 0, 8],
  };
  const totalPt = t.grid.reduce((a, b) => a + b, 0) / 20;
  if (t.jc === 'center') tbl.margin = [Math.max(0, (pt(CONTENT_W) - totalPt) / 2), 2, 0, 8];
  else if (t.ind) tbl.margin = [pt(t.ind), 2, 0, 8];
  return tbl;
}

/** Writes blocks as pdfmake nodes. Heading ids and end marks sit on leaf nodes so the layout reports their pages. */
function blockNodes(blocks: Block[], content: any[], img: (k: string) => string, firstBreak: boolean) {
  let first = firstBreak;
  let pending = false;
  blocks.forEach((b, bi) => {
    const nb = blocks[bi + 1];
    const beforeSmallTable = !!nb && ((nb.t === 'tbl' && nb.rows.length <= 15) || nb.t === 'img');
    switch (b.t) {
      case 'h': {
        const hang = b.lvl === 1 ? pt(567) : pt(851);
        const brk = first || b.pbBefore || pending;
        pending = false;
        const cols = b.num
          ? [{ width: hang, text: b.num, bold: true, headlineLevel: 2, id: markId(b.mark) }, { width: '*', text: b.x, bold: true, decoration: 'underline', id: b.id, headlineLevel: 2 }]
          : [{ width: '*', text: b.x, bold: true, decoration: b.lvl === 1 ? undefined : 'underline', fontSize: b.lvl === 1 ? 14 : 12, alignment: b.lvl === 1 ? 'center' : 'left', id: b.id, headlineLevel: 2 }];
        // a new page unless the heading already starts one (no blank pages): see NEW_PAGE in pageBreakBefore
        content.push({ columns: cols, columnGap: 0, fontSize: 12, margin: [0, brk ? 0 : 12, 0, 6], headlineLevel: brk ? NEW_PAGE : 1 });
        first = false;
        break;
      }
      case 'p': {
        const node: any = { text: inls(b.r, b.sz), alignment: b.jc === 'center' ? 'center' : b.jc === 'left' ? 'left' : 'justify', margin: [pt(b.l || 0), pt(b.before || 0), 0, pt(b.after ?? 120)], id: markId(b.mark) };
        if (b.keep || beforeSmallTable) node.headlineLevel = 1;
        if (b.pbBefore || pending) { node.headlineLevel = NEW_PAGE; node.margin[1] = 0; }
        pending = false;
        content.push(node);
        break;
      }
      case 'li': {
        const sym = SYMBOL_LABELS.has(b.label);
        const lab = { width: pt(b.h), text: b.label, font: sym ? 'Symbols' : undefined, fontSize: sym ? (b.sz / 2) * 0.85 : b.sz / 2, lineHeight: sym ? (1.2207 * b.sz / 2) / (1.1641 * (b.sz / 2) * 0.85) : 1 };
        content.push({
          columns: [lab, { width: '*', text: inls(b.r, b.sz), alignment: 'justify', id: markId(b.mark) }],
          columnGap: 0, fontSize: b.sz / 2, margin: [pt(b.l - b.h), 0, 0, b.after != null ? pt(b.after) : 3],
        });
        break;
      }
      case 'tbl':
        content.push(tableNode(b));
        break;
      case 'img':
        content.push({ image: img(b.key), width: pt(b.w), height: pt(b.h), alignment: b.jc === 'left' ? 'left' : 'center', margin: [0, pending ? 0 : 3, 0, 8], id: markId(b.mark), headlineLevel: pending ? NEW_PAGE : undefined });
        pending = false;
        break;
      case 'pb':
        pending = true; // the next block starts a new page
        break;
    }
  });
}

export interface PdfResult { bytes: Uint8Array; pages: Record<string, number>; pageCount: number }

/** "16" or "16-20" from the first page of a section and the page its last block ends on. */
export function pageRange(pages: Record<string, number> | undefined, id: string, end: string, leaf: boolean): string {
  const a = pages?.[id];
  if (a == null) return '';
  const b = pages?.[end];
  return leaf && b != null && b > a ? `${a}-${b}` : String(a);
}

export function pdfDefinition(m: DocModel, pages: Record<string, number>, tocPages: Record<string, number> | null): any {
  const images: Record<string, string> = {};
  const img = (k: string) => { if (!images[k]) images[k] = assetDataUrl(m.images[k]); return k; };
  const content: any[] = [];
  const c = m.cover;

  // ---------------- cover: Document No. / Revision / Date boxes (typed by hand; blank when not typed)
  const lab = (t: string) => ({ text: t, bold: true, fillColor: '#F2F2F2', fontSize: 9.5, margin: [0, 3, 0, 3] });
  const val = (t: string) => ({ text: t || ' ', bold: true, fontSize: 10, margin: [0, 3, 0, 3], alignment: 'center' });
  content.push({
    table: { widths: [64, '*', 44, 50, 30, 74], body: [c.boxes.flatMap(([k, v]) => [lab(k), val(v)])] },
    layout: { hLineWidth: () => 0.75, vLineWidth: () => 0.75, paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 1, paddingBottom: () => 1 },
    margin: [0, 0, 0, 10],
  });
  content.push({ text: c.title, bold: true, fontSize: 18, alignment: 'center', margin: [0, 0, 0, 8] });
  const boxW = pt(COVER_BOX.w), boxH = pt(COVER_BOX.h), line = 0.75;
  const innerW = boxW - 2 * line, innerH = boxH - 2 * line;
  let photo: any;
  if (c.photo) {
    const pw = pt(COVER_BOX.photoW), ph = pt(COVER_BOX.photoH);
    photo = { image: img(c.photo), width: pw, height: ph, margin: [(innerW - pw) / 2, (innerH - ph) / 2, 0, 0] };
  } else photo = { text: 'Project Cover Photo Here', alignment: 'center', fontSize: 11, margin: [0, innerH / 2 - 7, 0, 0] };
  content.push({
    table: { widths: [innerW], heights: [innerH], body: [[photo]] },
    layout: { hLineWidth: () => line, vLineWidth: () => line, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
    margin: [(pt(CONTENT_W) - boxW) / 2, 0, 0, 0],
  });
  if (c.logos.length) content.push({ columns: c.logos.map((k) => ({ width: '*', stack: [{ image: img(k), fit: [180, 36], alignment: 'center' }] })), margin: [0, 5, 0, 0] });
  content.push({
    table: { widths: [pt(2000) - 4, pt(340) - 4, '*'], body: c.parties.map(([k, v]) => [{ text: k, bold: true }, { text: ':', bold: true }, { text: v, bold: true }]) },
    layout: { defaultBorder: false, paddingLeft: () => 2, paddingRight: () => 2, paddingTop: () => 1.5, paddingBottom: () => 1.5 },
    fontSize: 10, margin: [0, 8, 0, 0],
  });
  content.push({ text: c.statement, fontSize: 10, alignment: 'justify', margin: [0, 8, 0, 5] });
  content.push({ text: [{ text: 'Document Status: ', bold: true }, c.status || '-'], fontSize: 10, margin: [0, 0, 0, 3] });
  const HD = (t: string) => ({ text: t, bold: true, color: '#FFFFFF', fillColor: '#' + NAVY, alignment: 'center' });
  const L = (t: string) => ({ text: t, bold: true, fillColor: '#F2F2F2' });
  content.push({
    table: {
      widths: [pt(1900) - 8.5, pt(2524) - 8.5, pt(2524) - 8.5, pt(2524) - 8.5],
      heights: ['auto', 'auto', 'auto', pt(700), pt(380)],
      body: [
        [HD(''), ...c.signatures.map((s) => HD(s.role))],
        [L('Name'), ...c.signatures.map((s) => ({ text: s.name || ' ', alignment: 'center' }))],
        [L('Designation'), ...c.signatures.map((s) => ({ text: s.desig || ' ', alignment: 'center' }))],
        [L('Signature'), ' ', ' ', ' '],
        [L('Date'), ' ', ' ', ' '],
      ],
    },
    layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, paddingLeft: () => 4.25, paddingRight: () => 4.25, paddingTop: () => 2, paddingBottom: () => 2 },
    fontSize: 10,
  });

  // ---------------- Document Control page
  blockNodes(m.front, content, img, false);

  // ---------------- table of contents: Section | Element | Page No. | code chapter (as the sample)
  content.push({ text: 'TABLE OF CONTENTS', bold: true, fontSize: 12, alignment: 'center', pageBreak: 'before', margin: [0, 0, 0, 10] });
  const code = m.toc.code;
  const head = (t: string, extra: any = {}) => ({ text: t, bold: true, color: '#FFFFFF', fillColor: '#' + NAVY, alignment: 'center', fontSize: 10.5, margin: [0, 3, 0, 3], ...extra });
  const body: any[][] = [[head('Section'), head('Element'), head('Page No.'), ...(code ? [head(code, { fontSize: 9.5 })] : [])]];
  const rows = m.toc.rows;
  rows.forEach((r, i) => {
    const firstOfGroup = i === 0 || rows[i - 1].group !== r.group;
    const pg = tocPages ? pageRange(tocPages, r.id, r.end, r.leaf) : '000-000';
    // the Section cell looks merged over its group: no lines between the group's rows (rowSpan would stretch rows across a page break)
    const lastOfGroup = i === rows.length - 1 || rows[i + 1].group !== r.group;
    const secCell = { text: firstOfGroup && r.group !== 'app' ? r.num.split('.')[0] : '', bold: true, alignment: 'center', border: [true, firstOfGroup, true, lastOfGroup], margin: [0, 1, 0, 1] };
    const el = r.lvl === 1 ? { text: r.title, bold: true } : { text: r.num ? `${r.num} ${r.title}` : r.title };
    body.push([secCell, { ...el, margin: [r.lvl === 1 ? 0 : 0, 1, 0, 1] }, { text: pg, alignment: 'center', margin: [0, 1, 0, 1] }, ...(code ? [{ text: r.chap || ' ', bold: true, alignment: 'center', margin: [0, 1, 0, 1] }] : [])]);
  });
  content.push({
    table: { headerRows: 1, dontBreakRows: true, widths: code ? [44, '*', 50, 150] : [50, '*', 60], body },
    layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 1, paddingBottom: () => 1 },
    fontSize: 10.5,
  });

  // ---------------- body
  blockNodes(m.blocks, content, img, true);

  const wm = m.watermark ? m.images[m.watermark] : null;
  let wmNode: any = null;
  if (wm) {
    const maxW = 467.8, maxH = 399.15;
    let w = maxW, h = (maxW * wm.h) / wm.w;
    if (h > maxH) { h = maxH; w = (maxH * wm.w) / wm.h; }
    const cx = pt(PAGE.left) + pt(CONTENT_W) / 2, cy = pt(PAGE.top) + (H_PT - pt(PAGE.top) - pt(PAGE.bottom)) / 2;
    wmNode = { image: img(m.watermark!), width: w, height: h, absolutePosition: { x: cx - w / 2, y: cy - h / 2 } };
  }
  const bannerUrl = img(m.banner);

  return {
    pageSize: 'A4',
    pageMargins: [pt(PAGE.left), pt(PAGE.top), pt(PAGE.right), pt(PAGE.bottom)],
    info: { title: `${m.title} - ${m.meta.project || ''}`, subject: m.docNo || m.title, creator: APP_NAME, producer: APP_NAME },
    defaultStyle: { font: 'Carlito', fontSize: 12, lineHeight: 1.0 },
    background: () => [
      ...(wmNode ? [wmNode] : []),
      { image: bannerUrl, width: 614.1, height: 81.1, absolutePosition: { x: 0, y: 13.04 } },
    ],
    footer: (page: number, count: number) => ({
      margin: [pt(PAGE.left), 14, pt(PAGE.right), 0], headlineLevel: 2,
      stack: [
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: pt(CONTENT_W), y2: 0, lineWidth: 0.5, lineColor: '#D9D9D9' }], headlineLevel: 2 },
        { columns: [{ text: m.footerLeft, width: '*', headlineLevel: 2 }, { text: `Page ${page} of ${count}`, width: 'auto', headlineLevel: 2 }], fontSize: 9, color: '#595959', margin: [0, 3, 0, 0], headlineLevel: 2 },
      ],
    }),
    content,
    images,
    pageBreakBefore: (node: any, following: any[]) => {
      if (node.id && node.startPosition) {
        if (node.id.startsWith('mk:')) {
          const last = Math.max(...(node.pageNumbers || [node.startPosition.pageNumber]));
          for (const k of node.id.slice(3).split('|')) pages[k] = last;
        } else pages[node.id] = node.startPosition.pageNumber;
      }
      if (node.headlineLevel === NEW_PAGE) return node.startPosition.top > TOP_PT + 0.5;
      if (node.headlineLevel === 3) return (node.pageNumbers || []).length > 1;
      if (node.headlineLevel !== 1) return false;
      return following.filter((f: any) => f.headlineLevel !== 2 && f.headlineLevel !== 1 && f.headlineLevel !== NEW_PAGE && !(f.headlineLevel === 3 && (f.pageNumbers || []).length > 1)).length === 0;
    },
  };
}

function render(def: any): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const doc = pdfMake.createPdf(def, undefined, FONTS, vfsJson);
      doc.getBuffer((buf: any) => resolve(buf instanceof Uint8Array ? buf : new Uint8Array(buf)));
    } catch (e) { reject(e); }
  });
}

/** Two passes: the first finds the page of every section, the second prints them in the table of contents. */
export async function makePdf(m: DocModel): Promise<PdfResult> {
  const first: Record<string, number> = {};
  await render(pdfDefinition(m, first, null));
  const pages: Record<string, number> = {};
  const bytes = await render(pdfDefinition(m, pages, first));
  return { bytes, pages: { ...first, ...pages }, pageCount: countPages(bytes) };
}

function countPages(bytes: Uint8Array): number {
  let n = 0;
  const s = new TextDecoder('latin1').decode(bytes);
  const re = /\/Type\s*\/Page[^s]/g;
  while (re.exec(s)) n++;
  return n;
}
