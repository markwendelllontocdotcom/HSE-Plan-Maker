import type { Project } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Today as DD.MM.YYYY (the date format of the Oxypro documents). */
export function todayDMY(): string {
  const d = new Date();
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** A typed date DD.MM.YYYY (also accepts D.M.YYYY, / or -). Returns the tidy DD.MM.YYYY, or null when it is not a real date. */
export function parseDMY(s: string): string | null {
  const m = /^\s*(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s*$/.exec(s || '');
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${pad(d)}.${pad(mo)}.${y}`;
}
/** ISO yyyy-mm-dd -> DD.MM.YYYY */
export function dmy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}
/** The year of a DD.MM.YYYY date, else this year. */
export function yearOf(s: string): string {
  const m = /(\d{4})\s*$/.exec(s || '');
  return m ? m[1] : String(new Date().getFullYear());
}

/** Project Code & Project Number: letters, digits and single hyphens, e.g. DXB-243 or P122 (same rule as PQP Maker). */
export const PROJECT_CODE = /^[A-Z0-9]+(-[A-Z0-9]+)*$/i;
export const PROJECT_CODE_MAX = 20;
export function projectCode(p: Project): string {
  const s = String(p.P02 || '').trim();
  return s.length <= PROJECT_CODE_MAX && PROJECT_CODE.test(s) ? s.toUpperCase() : '';
}

/** Revision as typed (two digits suggested), shown as Rev.00 */
export function revText(p: Project): string {
  return (p.D03 || '').trim();
}
export function revLabel(p: Project): string {
  const r = revText(p);
  return r ? 'Rev.' + r : 'Rev.';
}

export function joinAnd(items: string[]): string {
  const a = items.filter(Boolean);
  if (a.length <= 1) return a.join('');
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}

export function safeFileName(s: string): string {
  return s.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 150);
}

export const PLAN_EXT = '.hsep';

/** Plan file name, e.g. "DXB-101 - Sample Residential Tower (G+20) - HSE Plan - Rev 01.hsep". */
export function projectFileName(p: Project): string {
  const rev = revText(p) || '00';
  const no = projectCode(p) || String(p.P02 || '').trim();
  return safeFileName([no, (p.P01 || '').trim() || 'Untitled project', 'HSE Plan', `Rev ${rev}`].filter(Boolean).join(' - ')) + PLAN_EXT;
}

/** Export name, e.g. "OPEM-DXB-101-HS-PLN-001 Rev 01 - HSE Plan - Sample Residential Tower (G+20)".
 *  Without a Document No. yet: "DXB-101 Rev 01 - HSE Plan - …" */
export function outputBaseName(p: Project): string {
  const rev = revText(p) || '00';
  const lead = (p.D01 || '').trim() || projectCode(p) || 'Project';
  return safeFileName(`${lead} Rev ${rev} - HSE Plan - ${(p.P01 || '').trim() || 'Untitled'}`);
}
