import type { Project } from '../model/types';
import type { Platform } from '../gen/model';
import { esc } from './svgs';

/**
 * Appendix 1: Project HSE Organization Chart, drawn in the style of the Oxypro QA/QC Department chart (PQP Maker).
 * Section 7.1: the project HSE team reports directly to the Project Manager / Project Director at site and
 * functionally to the Corporate HSE Manager. Boxes carry role titles; names go in the table under the chart.
 * Units are px at 96 dpi.
 */
const NAVY = '#002060';
const RED = '#D81F27';
const INK = '#1a1a1a';
const FONT = "Carlito, Calibri, 'Segoe UI', Arial, sans-serif";

interface Box { x: number; y: number; w: number; h: number; lines: string[]; fill: boolean; tag: string; hse?: boolean; dashed?: boolean }

export function orgChart(_p: Project, fontCss: string | null, tags = false): { svg: string; w: number; h: number } {
  const W = 640, M = 10, BH = 52, GAP = 26;
  const BW = 250;
  const cx = W / 2 - 40, cxL = 150, cxR = 470;
  const at = (c: number, y: number, lines: string[], fill: boolean, tag: string, hse = false, w = BW, dashed = false): Box => ({ x: c - w / 2, y, w, h: BH, lines, fill, tag, hse, dashed });

  const yTop = 104;
  const pd = at(cx, yTop, ['PROJECTS DIRECTOR'], true, 'K01', false, 230);
  const chq = at(W - M - 105, yTop, ['CORPORATE HSE MANAGER', '(HEAD OFFICE)'], true, 'K03', true, 210);
  const pm = at(cx, pd.y + BH + GAP, ['PROJECT MANAGER'], true, 'K02', false, 230);
  const bus1 = pm.y + BH + GAP;
  const r3 = bus1 + GAP;
  const cm = at(cxL, r3, ['CONSTRUCTION MANAGER(S)'], true, 'K07');
  const hm = at(cxR, r3, ['PROJECT HSE MANAGER'], true, 'K04', true);
  const r4 = r3 + BH + GAP + 6;
  const es = at(cxL, r4, ['ENGINEERS & SUPERVISORS'], false, 'K08');
  const sho = at(cxR, r4, ['SENIOR HSE OFFICER(S)'], false, 'K05', true);
  const r5 = r4 + BH + GAP + 6;
  const fm = at(cxL, r5, ['FOREMEN / CHARGE HANDS'], false, 'K08');
  const ho = at(cxR, r5, ['HSE OFFICERS /', 'SAFETY INSPECTORS'], false, 'K06', true);
  const r6 = r5 + BH + GAP + 18;
  const all = at(W / 2, r6, ['ALL PERSONNEL / TECHNICIANS / LABOUR (INCLUDING SUB-CONTRACTORS)'], false, '', false, 560);
  const H = all.y + BH + M + 4;

  const solid: string[] = [];
  const mid = (b: Box) => b.x + b.w / 2;
  solid.push(`M${cx},${pd.y + BH}V${pm.y}`, `M${cx},${pm.y + BH}V${bus1}`, `M${cxL},${bus1}H${cxR}`, `M${cxL},${bus1}V${cm.y}`, `M${cxR},${bus1}V${hm.y}`);
  solid.push(`M${cxL},${cm.y + BH}V${es.y}`, `M${cxL},${es.y + BH}V${fm.y}`, `M${cxL},${fm.y + BH}V${all.y}`);
  solid.push(`M${cxR},${hm.y + BH}V${sho.y}`, `M${cxR},${sho.y + BH}V${ho.y}`);
  // functional lines: Corporate HSE Manager to the Project HSE Manager; HSE Officers to the workforce (advice and monitoring)
  const dashed: string[] = [];
  const chqX = mid(chq);
  dashed.push(`M${chqX},${chq.y + BH}V${hm.y + BH / 2}H${hm.x + hm.w}`);
  dashed.push(`M${cxR},${ho.y + BH}V${all.y}`);

  const box = (b: Box) => {
    const size = b.fill ? 14.5 : 15.5;
    const lh = size * 1.22;
    const y0 = b.y + b.h / 2 - ((b.lines.length - 1) * lh) / 2 + size * 0.35;
    const fillCol = b.fill ? (b.hse ? RED : NAVY) : '#ffffff';
    const stroke = b.hse ? RED : NAVY;
    const text = b.lines
      .map((l, i) => `<text x="${b.x + b.w / 2}" y="${(y0 + i * lh).toFixed(1)}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${i > 0 && b.lines[i].startsWith('(') ? size - 2 : size}" fill="${b.fill ? '#ffffff' : INK}">${esc(l)}</text>`)
      .join('');
    const rect = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${fillCol}" stroke="${stroke}" stroke-width="1.4"${b.dashed ? ' stroke-dasharray="4 3"' : ''}/>`;
    const tag = tags && b.tag
      ? `<rect x="${b.x + b.w - 34}" y="${b.y - 9}" width="38" height="18" rx="9" fill="#111827"/><text x="${b.x + b.w - 15}" y="${b.y + 4.5}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="12" fill="#ffffff">${b.tag}</text>`
      : '';
    return rect + text + tag;
  };

  const lx = M;
  const legend = `<path d="M${lx},58H${lx + 50}" stroke="${INK}" stroke-width="1.1" stroke-dasharray="3 2.5"/><text x="${lx + 60}" y="62" font-family="${FONT}" font-size="12" fill="${INK}">Functional Reporting</text>
<path d="M${lx},78H${lx + 50}" stroke="${INK}" stroke-width="1.1"/><text x="${lx + 60}" y="82" font-family="${FONT}" font-size="12" fill="${INK}">Direct Reporting</text>
<rect x="${lx + 200}" y="51" width="22" height="12" fill="${NAVY}"/><text x="${lx + 230}" y="62" font-family="${FONT}" font-size="12" fill="${INK}">Project Management</text>
<rect x="${lx + 200}" y="71" width="22" height="12" fill="${RED}"/><text x="${lx + 230}" y="82" font-family="${FONT}" font-size="12" fill="${INK}">HSE Department</text>`;
  const title = `<text x="${W / 2}" y="28" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="20" fill="${NAVY}">PROJECT HSE ORGANIZATION CHART</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${fontCss ? `<style>${fontCss}</style>` : ''}
<rect width="${W}" height="${H}" fill="#ffffff"/>
${title}
${legend}
<path d="${solid.join('')}" stroke="${INK}" stroke-width="1.2" fill="none"/>
<path d="${dashed.join('')}" stroke="${INK}" stroke-width="1.2" stroke-dasharray="4 3" fill="none"/>
${[pd, chq, pm, cm, hm, es, sho, fm, ho, all].map(box).join('\n')}
</svg>`;
  return { svg, w: W, h: H };
}

export async function orgChartSvg(p: Project, plat: Platform): Promise<{ svg: string; w: number; h: number }> {
  return orgChart(p, await plat.fontCss());
}
