import type { Project, Settings, ExtraPerson } from '../model/types';
import { codeHeading, codeLine, BUILTIN_POLICIES } from '../model/defaults';
import { revLabel, projectCode, yearOf } from '../model/format';
import type { Block, DocModel, Run, Platform, Row, Cell, CellPara, ImgAsset, TocRow } from '../gen/model';
import { CONTENT_W, NAVY } from '../gen/model';
import { SECTIONS, APPENDICES, TERMS, WARNINGS, type Sec, type Body, type Item } from './hse';
import { orgChartSvg } from './orgchart';
import { bannerSvg, fadeSvg } from './svgs';

export const TITLE = 'Project Health, Safety & Environment Plan';

export interface Unit { id: string; level: number; title: string; parent?: string; added?: boolean }

/** Every switchable unit in document order (Plan Sections checklist). */
export function sectionUnits(): Unit[] {
  return [
    ...SECTIONS.map((s) => ({ id: s.id, level: s.level, title: s.title, parent: s.parent })),
    { id: 'app', level: 1, title: 'Appendices' },
    ...APPENDICES.map((a) => ({ id: a.id, level: 2, title: a.title, parent: 'app', added: a.added })),
  ];
}

/** Numbers of the units that are switched on, e.g. s8.17 -> "8.17", app:org -> "Appendix 1". */
export function numbering(off: Set<string>): Record<string, string> {
  const out: Record<string, string> = {};
  let h1 = 0, h2 = 0, ap = 0;
  for (const s of SECTIONS) {
    if (off.has(s.id) || (s.parent && off.has(s.parent))) continue;
    if (s.level === 1) { h1++; h2 = 0; out[s.id] = String(h1); }
    else { h2++; out[s.id] = `${h1}.${h2}`; }
  }
  if (!off.has('app')) {
    for (const a of APPENDICES) if (!off.has(a.id)) out[a.id] = `Appendix ${++ap}`;
    if (ap) out.app = 'Appendices';
  }
  return out;
}

const stripMs = (s: string) => s.replace(/^\s*M\/s\.?\s*/i, '').trim();
function titleCaseCompany(s: string): string {
  return s.split(/\s+/).map((w) => (/^(LLC|L\.L\.C\.?|FZE|FZCO|FZ-LLC|W\.L\.L\.?|PJSC)$/i.test(w) ? w.toUpperCase() : w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase())).join(' ');
}
const txt = (x: string, extra: Partial<Run> = {}): Run => ({ x, ...extra });

const LIFT_AUTH: Record<string, string> = { Dubai: 'Dubai Municipality' };
const CIVIL_DEF: Record<string, string> = { Dubai: 'Dubai Civil Defence', 'Abu Dhabi': 'Abu Dhabi Civil Defence', Sharjah: 'Sharjah Civil Defence' };

export function people(p: Project): { role: string; name: string; email: string; phone: string }[] {
  const team = (rows: ExtraPerson[] | undefined, role: string) => (rows || []).map((x) => ({ ...x, role: (x.role || '').trim() || role }));
  const list = [
    { role: 'Projects Director', ...p.K01 },
    { role: 'Project Manager', ...p.K02 },
    ...team(p.K07, 'Construction Manager'),
    { role: 'Corporate HSE Manager', ...p.K03 },
    { role: 'Project HSE Manager', ...p.K04 },
    ...(p.K05 || []).map((x) => ({ role: 'Senior HSE Officer', ...x })),
    ...(p.K06 || []).map((x) => ({ role: 'HSE Officer', ...x })),
    ...team(p.K08, 'Engineer / Supervisor'),
    ...team(p.K09, 'Staff'),
  ];
  return list.filter((x) => x.name && x.name.trim()).map((x) => ({ role: x.role, name: x.name.trim(), email: (x.email || '').trim(), phone: (x.phone || '').trim() }));
}

export async function buildDoc(p: Project, s: Settings, plat: Platform): Promise<DocModel> {
  const off = new Set(p.OFF || []);
  const nums = numbering(off);
  const on = (id: string) => id in nums;
  const images: Record<string, ImgAsset> = {};
  let imgN = 0;
  const addImg = (a: ImgAsset, key?: string) => { const k = key || 'img' + (++imgN); images[k] = a; return k; };

  const co = (s.companyShort || 'Oxypro').trim();
  const company = titleCaseCompany(stripMs(p.R04 || s.companyName));
  const project = p.P01.trim() || '[Project Name]';
  const appNo = (key: string) => nums['app:' + key];
  const tokens: Record<string, string> = {
    CO: co,
    COMPANY: company,
    PROJECT: project,
    T02: /^\d+$/.test(p.T02) ? p.T02 : '24',
    AWARD: `${/^\d+$/.test(p.O03) ? Number(p.O03).toLocaleString('en-US') : '500'} AED`,
    LIFTAUTH: LIFT_AUTH[p.P04] || 'the relevant local authority',
    CIVILDEF: CIVIL_DEF[p.P04] || 'Civil Defence',
    ORGREF: appNo('org') ? `is attached in ${appNo('org')} of this project HSE plan` : 'is maintained by the Project HSE Department',
  };
  const tok = (x: string) => x
    .replace(/\{\{SECREF:([\w.]+)\}\}/g, (_, id) => (nums[id] ? `section ${nums[id]} of this plan` : 'the project HSE organization'))
    .replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? '');
  /** **bold** inside the standard text */
  const runs = (x: string, extra: Partial<Run> = {}): Run[] => tok(x).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) => (part.startsWith('**') ? txt(part.slice(2, -2), { ...extra, b: 1 }) : txt(part, extra)));

  const out: Block[] = [];
  const SZ = 24; // 12 pt body text, as in the PQP
  let seq = 0;

  // ---------------- end-of-section marks (page ranges in the table of contents)
  const open: { id: string; lvl: number }[] = [];
  const closeTo = (lvl: number) => {
    while (open.length && open[open.length - 1].lvl >= lvl) {
      const u = open.pop()!;
      const last = out[out.length - 1] as any;
      if (last && last.t !== 'pb') (last.mark = last.mark || []).push('end:' + u.id);
    }
  };
  const H = (lvl: 1 | 2, num: string, x: string, id: string, pbBefore = false) => {
    closeTo(lvl);
    out.push({ t: 'h', lvl, num, x, id, pbBefore });
    open.push({ id, lvl });
  };

  // ---------------- block helpers
  const P = (r: Run[], l: number, extra: Partial<Extract<Block, { t: 'p' }>> = {}) => out.push({ t: 'p', r, l, sz: SZ, jc: 'both', ...extra });
  const SUB = (x: string, l: number, u = false) => P([txt(tok(x), { b: 1, u: u ? 1 : undefined })], l, { keep: true, jc: 'left', after: 80, before: 60 });
  const bulletList = (items: Item[], l: number, k: 'bullet' | 'arrow' | 'check' = 'bullet') => {
    const n = ++seq;
    for (const it of items) {
      const t = typeof it === 'string' ? it : it.t;
      out.push({ t: 'li', k, label: k === 'bullet' ? '•' : k === 'arrow' ? '➢' : '✓', seq: n, lvl: 0, l, h: 360, r: runs(t), sz: SZ });
      if (typeof it !== 'string' && it.sub) bulletList(it.sub, l + 567, 'arrow');
    }
    lastList();
  };
  const numList = (items: string[], l: number) => {
    const n = ++seq;
    items.forEach((t, i) => out.push({ t: 'li', k: 'num', label: `${i + 1}.`, seq: n, lvl: 0, l, h: 425, r: runs(t), sz: SZ }));
    lastList();
  };
  /** a little space after a list */
  const lastList = () => { const last = out[out.length - 1] as any; if (last?.t === 'li') last.after = 120; };

  const hdrCell = (x: string, jc = 'center'): Cell => ({ p: x.split('\n').map((line) => ({ r: [txt(line, { b: 1 })], jc })), fill: NAVY, color: 'FFFFFF', bold: true, va: 'center' });
  const cell = (x: string, extra: Partial<Cell> = {}, jc?: string): Cell => ({ p: x.split('\n').map((line) => ({ r: [txt(line)], jc })), ...extra });

  // ---------------- body
  for (const sec of SECTIONS) {
    if (!on(sec.id)) continue;
    H(sec.level, sec.level === 1 ? nums[sec.id] + '.' : nums[sec.id], sec.title, sec.id);
    const base = sec.level === 1 ? 567 : 851;
    for (const b of sec.body) await body(b, sec, base);
  }

  async function body(b: Body, sec: Sec, base: number) {
    if (typeof b === 'string') { P(runs(b), base); return; }
    if ('sub' in b) { SUB(b.sub, base, !!b.u); return; }
    if ('ul' in b) { bulletList(b.ul, base + (b.deep ? 851 : 425)); return; }
    if ('ol' in b) { numList(b.ol, base + (b.deep ? 851 : 425)); return; }
    await slot(b.slot, base);
  }

  async function slot(id: string, base: number) {
    switch (id) {
      case 'legislation': {
        const list = [...p.L01.map((x) => x.trim()).filter(Boolean)];
        const code = codeLine(p);
        if (code) list.push(code);
        bulletList(list, base + 425);
        break;
      }
      case 'mep-scope': {
        const summary = p.P07.trim();
        if (summary) {
          P([txt('The MEP scope of works for the project is summarised below. Please refer to Contract Documents for the complete MEP Scope of Works.')], base);
          P([txt('Summary of Works', { b: 1, u: 1 })], base, { keep: true, jc: 'left', after: 80 });
          summary.split(/\n+/).forEach((line) => P(runs(line.trim()), base));
        } else P([txt('Please refer to Contract Documents for MEP Scope of Works.')], base);
        if (p.P08.length) {
          P([txt('Disciplines covered by this HSE Plan', { b: 1, u: 1 })], base, { keep: true, jc: 'left', after: 80 });
          bulletList(p.P08, base + 425);
        }
        const loc = [p.P05.trim(), p.P04, 'UAE'].filter(Boolean).join(', ');
        const info: [string, string][] = [
          ['Project', project],
          ['Project Code & Project Number', projectCode(p)],
          ['Location', loc],
          ['Our Role', p.R05],
          ['Building Configuration / Description', p.P13.trim()],
        ];
        P([txt('Project Information', { b: 1, u: 1 })], base, { keep: true, jc: 'left', after: 80 });
        out.push({ t: 'tbl', grid: [3000, CONTENT_W - base - 3000], rows: info.filter(([, v]) => v).map(([k, v]) => ({ c: [cell(k, { bold: true, fill: 'F2F2F2' }), cell(v)] })), ind: base });
        break;
      }
      case 'terms': {
        const party = (term: string, v: string, ph: string): Row => ({ c: [cell(''), cell(term, { bold: true }), { p: [{ r: [txt(stripMs(v) || ph, { b: 1 })] }] }] });
        const rows: Row[] = [
          party('Client', p.R01, '[Client Name]'),
          party('Lead Consultant', p.R02, '[Lead Consultant]'),
          ...(p.R02m.trim() && stripMs(p.R02m).toLowerCase() !== stripMs(p.R02).toLowerCase() ? [party('MEP Consultant', p.R02m, '')] : []),
          party('Main Contractor', p.R03, '[Main Contractor]'),
          party('MEP Contractor', p.R04 || s.companyName, '[MEP Contractor]'),
          ...TERMS.map((t): Row => {
            const paras: CellPara[] = [{ r: t.bold ? [txt(t.bold, { b: 1 }), txt(t.def)] : [txt(t.def)], jc: 'both' }];
            for (const bl of t.bullets || []) paras.push({ r: [txt(bl)], li: '1', jc: 'left' });
            if (t.after) paras.push({ r: [txt(t.after)] });
            return { c: [cell(''), cell(t.term, { bold: true, va: 'center' }), { p: paras, va: 'center' }] };
          }),
        ];
        rows.forEach((r, i) => { r.c[0] = { p: [{ r: [txt(String(i + 1))], jc: 'center' }], va: 'center' }; });
        out.push({ t: 'tbl', grid: [850, 2650, 5800], rows: [{ header: true, c: [hdrCell('Sl.No.'), hdrCell('TERM'), hdrCell('DEFINITION')] }, ...rows], jc: 'center' });
        break;
      }
      case 'swp': bulletList(p.S01.filter((x) => x.trim()), base + 851); break;
      case 'hses': bulletList(p.S02.filter((x) => x.trim()), base + 851); break;
      case 'competence': bulletList(p.S03.filter((x) => x.trim()), base + 1418); break;
      case 'policies': {
        const list = p.POL.filter((x) => x.on);
        if (!list.length) { P([txt('The HSE Policy Statements are to be attached.', { i: 1 })], base); break; }
        P(runs(`The following {{CO}} HSE Policy Statements apply to this project. Each statement is reproduced on the following pages:`), base);
        out.push({ t: 'tbl', grid: [850, 5600, 2400], ind: base + 284, rows: [
          { header: true, c: [hdrCell('Sl.No.'), hdrCell('Policy Statement'), hdrCell('Reference')] },
          ...list.map((x, i) => ({ c: [cell(String(i + 1), {}, 'center'), cell(x.title), cell(x.ref || '—', {}, 'center')] })),
        ] });
        for (const x of list) {
          const a = x.image ? await plat.dataUrlToAsset(x.image.dataUrl) : BUILTIN_POLICIES.includes(x.key) ? await plat.policy(x.key) : null;
          P([txt(x.title.toUpperCase(), { b: 1, u: 1 })], 0, { jc: 'left', keep: true, pbBefore: true, after: 120 });
          if (a) fitImage(a, CONTENT_W - 200, 12400);
          else P([txt(`${x.title} to be attached.`, { i: 1 })], 0);
        }
        break;
      }
      case 'permits': {
        const rows = p.T01.filter((r) => r.activity.trim());
        out.push({ t: 'tbl', grid: [4300, 1700, 2900], ind: base, rows: [
          { header: true, c: [hdrCell('Work Activity'), hdrCell('Permit in Force\nYES / NO'), hdrCell('Permit Issued By')] },
          ...rows.map((r) => ({ c: [cell(tok(r.activity)), cell(r.inForce || '', {}, 'center'), cell(tok(r.issuedBy), {}, 'center')] })),
        ] });
        break;
      }
      case 'flowchart': {
        P([txt('Incident Investigation Flowchart', { b: 1 })], base, { keep: true, jc: 'left', before: 120, after: 120 });
        fitImage(await plat.asset('flowchart'), CONTENT_W - base, 11800, base);
        break;
      }
      case 'warnings': {
        for (const w of WARNINGS) {
          const n = ++seq;
          out.push({ t: 'li', k: 'bullet', label: '•', seq: n, lvl: 0, l: base + 425, h: 360, r: [txt(w.level, { b: 1 })], sz: SZ });
          bulletList(w.who, base + 1134, 'arrow');
          P([txt('Action to be taken:', { b: 1 })], base + 851, { keep: true, jc: 'left', after: 60 });
          bulletList(w.action, base + 1418, 'check');
        }
        break;
      }
      case 'objectives': numList(p.O01.filter((x) => x.trim()), base + 425); break;
      case 'targets': numList(p.O02.filter((x) => x.trim()), base + 425); break;
    }
  }

  /** an image fitted into w x h twips */
  function fitImage(a: ImgAsset, maxW: number, maxH: number, ind = 0) {
    let w = maxW, h = Math.round((maxW * a.h) / a.w);
    if (h > maxH) { h = maxH; w = Math.round((maxH * a.w) / a.h); }
    out.push({ t: 'img', key: addImg(a), w, h, jc: ind ? 'left' : 'center' });
  }

  // ---------------- appendices
  if (on('app')) {
    const list = APPENDICES.filter((a) => on(a.id));
    closeTo(1);
    if (list.length) {
      H(1, '', 'Appendices', 'app', true);
      for (const [i, a] of list.entries()) {
        H(2, '', `${nums[a.id]}: ${a.title}`, a.id, i > 0);
        if (a.key === 'org') {
          const svg = await orgChartSvg(p, plat);
          const png = await plat.svgToPng(svg.svg, svg.w * 2, svg.h * 2);
          const wTw = Math.min(CONTENT_W - 200, Math.round(svg.w * 13.5));
          out.push({ t: 'img', key: addImg(png), w: wTw, h: Math.round((wTw * svg.h) / svg.w), jc: 'center' });
          const ppl = people(p);
          const withContacts = ppl.some((x) => x.email || x.phone);
          const head = withContacts ? ['Role', 'Name', 'Email', 'Phone'] : ['Role', 'Name'];
          if (ppl.length) out.push({ t: 'tbl', grid: withContacts ? [2600, 2300, 2700, 1700] : [4300, 4300], jc: 'center', rows: [
            { header: true, c: head.map((h) => hdrCell(h)) },
            ...ppl.map((x) => ({ c: (withContacts ? [x.role, x.name, x.email, x.phone] : [x.role, x.name]).map((v) => cell(v)) })),
          ] });
        }
        if (a.key === 'risk' || a.key === 'env') {
          const imgs = a.key === 'risk' ? p.A02 : p.A03;
          const ref = (a.key === 'risk' ? p.A02ref : p.A03ref).trim();
          if (imgs.length) {
            for (const [j, im] of imgs.entries()) {
              if (j > 0) out.push({ t: 'pb' });
              fitImage(await plat.dataUrlToAsset(im.dataUrl), CONTENT_W, 12600);
            }
          } else {
            P([txt(`The ${a.title}${ref ? ` (Ref. ${ref})` : ''} is attached separately to this Project HSE Plan.`)], 567);
            P([txt(`The Project HSE Manager keeps the ${a.title} up to date as the project develops (refer Section ${nums['s5.2'] || '5'}).`)], 567);
          }
        }
        if (a.key === 'contacts') {
          const rows = p.E01.filter((r) => r.service.trim() || r.number.trim());
          out.push({ t: 'tbl', grid: [850, 5000, 3000], jc: 'center', rows: [
            { header: true, c: [hdrCell('Sl.No.'), hdrCell('Service / Contact'), hdrCell('Contact Number')] },
            ...rows.map((r, j) => ({ c: [cell(String(j + 1), {}, 'center'), cell(r.service), cell(r.number, { bold: true }, 'center')], minH: 400 })),
          ] });
          P([txt('These numbers are displayed on the project notice boards and briefed at the HSE Induction.', { i: 1 })], 0);
        }
      }
    }
  }
  closeTo(0);

  // ---------------- table of contents rows
  const toc: TocRow[] = [];
  const has = (id: string) => out.some((b) => b.t === 'h' && b.id === id);
  let group = '';
  for (const sec of SECTIONS) {
    if (!has(sec.id)) continue;
    if (sec.level === 1) group = sec.id;
    const kids = SECTIONS.some((x) => x.parent === sec.id && has(x.id));
    toc.push({ id: sec.id, end: 'end:' + sec.id, num: nums[sec.id], title: sec.toc || sec.title, lvl: sec.level, group, chap: (p.CHAP || {})[sec.id] ?? '', leaf: !kids });
  }
  if (has('app')) {
    toc.push({ id: 'app', end: 'end:app', num: '', title: 'Appendices', lvl: 1, group: 'app', chap: (p.CHAP || {}).app ?? 'N/A', leaf: false });
    for (const a of APPENDICES) if (has(a.id)) toc.push({ id: a.id, end: 'end:' + a.id, num: '', title: `${nums[a.id]}: ${a.title}`, lvl: 2, group: 'app', chap: (p.CHAP || {}).app ?? 'N/A', leaf: true });
  }

  // ---------------- front page: Document Control, Amendment Record, copyright
  const front: Block[] = [];
  const fP = (r: Run[], extra: Partial<Extract<Block, { t: 'p' }>> = {}) => front.push({ t: 'p', r, l: 0, sz: SZ, jc: 'left', ...extra });
  fP([txt('Document Control', { b: 1, sz: 24 })], { jc: 'center', pbBefore: true, after: 160 });
  const docNo = p.D01.trim(), rev = p.D03.trim(), date = p.D04.trim();
  const ctl: [string, string][] = [
    ['Document Title', TITLE],
    ['Project', project],
    ['Document No.', docNo],
    ['Revision No.', rev],
    ['Revision Date', date],
    ['Department', p.D12.trim()],
    ['Owner', p.D13.trim()],
    ['Implementation Date', p.D14.trim()],
    ['Last Reviewed Date', p.D15.trim()],
    ['Approved Authority', p.D16.trim()],
  ];
  front.push({ t: 'tbl', grid: [3000, CONTENT_W - 3000], jc: 'center', rows: ctl.map(([k, v]) => ({ c: [cell(k, { bold: true, fill: 'F2F2F2', va: 'center' }), cell(v, { va: 'center' })], minH: 400 })) });
  fP([txt('Amendment Record', { b: 1, sz: 24 })], { jc: 'center', before: 120, after: 160, keep: true });
  const amendHead = ['Document No.', 'Rev. No.', 'Revision Date', 'Particulars of Revision'];
  front.push({ t: 'tbl', grid: [2943, 1161, 1701, CONTENT_W - 5805], jc: 'center', rows: [
    { header: true, c: amendHead.map((x) => hdrCell(x)) },
    ...p.H01.map((h) => ({ c: [cell(docNo, { va: 'center' }, 'center'), cell(h.rev, { va: 'center' }, 'center'), cell(h.date, { va: 'center' }, 'center'), cell(h.desc, { va: 'center' })], minH: 400 })),
    ...[0, 1].map(() => ({ c: [cell(''), cell(''), cell(''), cell('')], minH: 400 })),
  ] });
  front.push({ t: 'tbl', grid: [CONTENT_W], jc: 'center', rows: [{ c: [{ p: [
    { r: [txt(`Copyright © ${yearOf(date)} ${company}`, { b: 1 })] },
    { r: [txt('')] },
    { r: [txt(`This document is the property of ${company}.`)] },
    { r: [txt('')] },
    { r: [txt(`All rights are reserved. No revision of this document can be made, reproduced, distributed or transmitted in any form or by any means, including and not limited to, photocopying, recording or any other electronic means without prior written consent of the ${company} management.`)], jc: 'both' },
  ] }] }] });

  // ---------------- branding images
  const defaultBrand = !p.R09 && (p.R11 || '').trim() === 'THE COMPLETE SOLUTION FOR BUILDING SERVICES';
  let banner: ImgAsset;
  if (defaultBrand) banner = await plat.asset('banner');
  else {
    const logo = p.R09 ? await plat.dataUrlToAsset(p.R09.dataUrl) : await plat.asset('logo');
    const svg = await bannerSvg(logo, p.R11 || '', s.brandColor || '#D72025', plat);
    banner = await plat.svgToPng(svg, 1637, 216);
  }
  addImg(banner, 'banner');
  let watermark: string | null = null;
  if (p.R12on) {
    if (p.R12) {
      const src = await plat.dataUrlToAsset(p.R12.dataUrl);
      const svg = fadeSvg(src, s.watermarkOpacity || 0.08);
      watermark = addImg(await plat.svgToPng(svg.svg, svg.w, svg.h), 'watermark');
    } else watermark = addImg(await plat.asset('watermark'), 'watermark');
  }

  // ---------------- cover
  const photo = p.R10 ? addImg(await plat.dataUrlToAsset(p.R10.dataUrl), 'cover') : null;
  const logos: string[] = [];
  for (const im of [p.R07, p.R08]) if (im) logos.push(addImg(await plat.dataUrlToAsset(im.dataUrl)));
  const ms = (x: string, ph: string) => 'M/s. ' + (stripMs(x) || ph);
  const cover = {
    boxes: [['Document No.', docNo], ['Revision', rev], ['Date', date]] as [string, string][],
    title: TITLE,
    photo, logos,
    parties: [
      ['Project', p.P01.trim() || '[PROJECT NAME]'],
      ['Location', [p.P05.trim(), p.P04, 'UAE'].filter(Boolean).join(', ') || '[PROJECT LOCATION]'],
      ['Client', ms(p.R01, '[CLIENT NAME]')],
      ['Consultant', ms(p.R02, '[CONSULTANT NAME]')],
      ['Main Contractor', ms(p.R03, '[MAIN CONTRACTOR NAME]')],
      ['MEP Contractor', ms(p.R04 || s.companyName, '[MEP CONTRACTOR NAME]')],
    ] as [string, string][],
    statement: 'This Project Health, Safety & Environment Plan sets out the HSE organization, responsibilities and arrangements applicable to this project and as such has been reviewed for adequacy and is approved for implementation.',
    status: p.D05,
    signatures: [
      { role: 'Initiated By', name: p.D06, desig: p.D07 },
      { role: 'Reviewed By', name: p.D08, desig: p.D09 },
      { role: 'Approved By', name: p.D10, desig: p.D11 },
    ],
  };

  const footerLeft = [docNo || 'Project HSE Plan', rev ? revLabel(p) : '', date].filter(Boolean).join('  |  ');
  return {
    docNo, rev, footerLeft, title: TITLE,
    cover, front, toc: { code: p.C01 === 'none' ? null : (p.C01name || codeHeading(p.C01)).trim() || 'Code of Practice', rows: toc },
    banner: 'banner', watermark, blocks: out, images,
    meta: { project: p.P01, company, created: new Date().toISOString() },
  };
}
