import type { Project } from './types';
import { EMIRATES, DISCIPLINES, ROLES, STATUSES, LEGISLATION, LEGISLATION_EXTRA, SWP, HSES, COMPETENCE, OBJECTIVES, TARGETS } from './defaults';
import { parseDMY, PROJECT_CODE, PROJECT_CODE_MAX } from './format';

export type FieldType =
  | 'text' | 'longtext' | 'number' | 'dmy' | 'dropdown' | 'multi' | 'image' | 'images'
  | 'person' | 'persons' | 'people' | 'revisions' | 'toggle' | 'sections'
  | 'lines' | 'permits' | 'contacts' | 'policies' | 'code' | 'docbox';

export interface FieldSpec {
  id: keyof Project | string;
  group: string;
  label: string;
  type: FieldType;
  mandatory: boolean;
  options?: string[];
  max?: number;      // characters
  min?: number;      // numbers
  maxN?: number;
  code?: boolean;    // project code: letters, digits and single hyphens, typed in upper case
  maxMB?: number;
  help?: string;
  usedIn?: string;
  section?: string;  // sub-heading shown above this field
  placeholder?: string;
  reset?: string[];  // standard list for "lines" fields
  extra?: string[];  // optional lines that can be added with one click
  numbered?: boolean;
  personMax?: number;
}

export const GROUPS = [
  { id: 'project', title: '1. Project Information' },
  { id: 'parties', title: '2. Project Parties' },
  { id: 'doc', title: '3. Document Control' },
  { id: 'people', title: '4. HSE Organization' },
  { id: 'reqs', title: '5. HSE Requirements' },
  { id: 'policies', title: '6. HSE Policy Statements' },
  { id: 'appendix', title: '7. Appendices' },
  { id: 'sections', title: 'Plan Sections' },
  { id: 'branding', title: 'Branding' },
];

export const FIELDS: FieldSpec[] = [
  { id: 'P01', group: 'project', label: 'Project Name', type: 'text', mandatory: true, max: 150, help: 'Full official project name', usedIn: 'Cover, 2 Scope & Purpose, 5.3, 7.1, 9' },
  { id: 'P02', group: 'project', label: 'Project Code & Project Number', type: 'text', mandatory: true, code: true, max: PROJECT_CODE_MAX, help: 'Letters, numbers and hyphens, as in the PQP (e.g. DXB-243, P122)', usedIn: 'File names, 3 Scope of MEP Works' },
  { id: 'P04', group: 'project', label: 'Location / Emirate', type: 'dropdown', mandatory: true, options: EMIRATES, help: 'Abu Dhabi switches the code column to OSHAD-SF (asked first)', usedIn: 'Cover, code of practice' },
  { id: 'P05', group: 'project', label: 'Plot No. / Address', type: 'text', mandatory: false, help: 'Plot number and community / area', usedIn: 'Cover' },
  { id: 'P07', group: 'project', label: 'Scope of MEP Works (summary)', type: 'longtext', mandatory: false, max: 2000, help: 'Empty keeps the sample sentence "Please refer to Contract Documents for MEP Scope of Works."', usedIn: '3 Scope of MEP Works' },
  { id: 'P08', group: 'project', label: 'Disciplines', type: 'multi', mandatory: false, options: DISCIPLINES, usedIn: '3 Scope of MEP Works' },
  { id: 'P13', group: 'project', label: 'Building Configuration / Description', type: 'longtext', mandatory: false, max: 500, help: 'e.g. B+G+20+R, built-up area', usedIn: '3 Scope of MEP Works' },

  { id: 'R01', group: 'parties', label: 'Client / Employer', type: 'text', mandatory: true, help: 'Enter the name without "M/s." (the cover adds it)', usedIn: 'Cover, 4 Terms & Definitions' },
  { id: 'R02', group: 'parties', label: 'Lead Consultant', type: 'text', mandatory: true, usedIn: 'Cover, 4 Terms & Definitions' },
  { id: 'R02m', group: 'parties', label: 'MEP Consultant', type: 'text', mandatory: false, help: 'Only when different from the Lead Consultant', usedIn: '4 Terms & Definitions' },
  { id: 'R03', group: 'parties', label: 'Main Contractor', type: 'text', mandatory: true, usedIn: 'Cover, 4 Terms & Definitions' },
  { id: 'R04', group: 'parties', label: 'MEP Contractor', type: 'text', mandatory: true, usedIn: 'Cover, 4 Terms & Definitions' },
  { id: 'R05', group: 'parties', label: 'Our Role', type: 'dropdown', mandatory: false, options: ROLES, usedIn: '3 Scope of MEP Works' },
  { id: 'R07', group: 'parties', label: 'Client Logo', type: 'image', mandatory: false, maxMB: 2, usedIn: 'Cover (only when added)' },
  { id: 'R08', group: 'parties', label: 'Consultant Logo', type: 'image', mandatory: false, maxMB: 2, usedIn: 'Cover (only when added)' },
  { id: 'R10', group: 'parties', label: 'Cover Photo', type: 'image', mandatory: false, maxMB: 5, help: 'Landscape photo or rendering. Empty shows the "Project Cover Photo Here" box', usedIn: 'Cover' },

  { id: 'DOCBOX', group: 'doc', section: 'Cover boxes (type them to finalise the document)', label: 'Document No. / Revision / Date', type: 'docbox', mandatory: false, help: 'Typed by hand. Left empty, the boxes print blank so they can be filled in on the document.', usedIn: 'Cover boxes, Document Control page, footer' },
  { id: 'D05', group: 'doc', label: 'Document Status', type: 'dropdown', mandatory: true, options: STATUSES, usedIn: 'Cover' },
  { id: 'D12', group: 'doc', section: 'Document Control page', label: 'Department', type: 'text', mandatory: false, usedIn: 'Document Control page' },
  { id: 'D13', group: 'doc', label: 'Owner', type: 'text', mandatory: false, usedIn: 'Document Control page' },
  { id: 'D14', group: 'doc', label: 'Implementation Date', type: 'dmy', mandatory: false, usedIn: 'Document Control page' },
  { id: 'D15', group: 'doc', label: 'Last Reviewed Date', type: 'dmy', mandatory: false, usedIn: 'Document Control page' },
  { id: 'D16', group: 'doc', label: 'Approved Authority', type: 'text', mandatory: false, usedIn: 'Document Control page' },
  { id: 'D06', group: 'doc', section: 'Signatures on the cover', label: 'Initiated By – Name', type: 'text', mandatory: true, help: 'Follows the Project HSE Manager under 4. HSE Organization', usedIn: 'Cover' },
  { id: 'D07', group: 'doc', label: 'Initiated By – Designation', type: 'text', mandatory: true, usedIn: 'Cover' },
  { id: 'D08', group: 'doc', label: 'Reviewed By – Name', type: 'text', mandatory: true, help: 'Follows the Project Manager', usedIn: 'Cover' },
  { id: 'D09', group: 'doc', label: 'Reviewed By – Designation', type: 'text', mandatory: true, usedIn: 'Cover' },
  { id: 'D10', group: 'doc', label: 'Approved By – Name', type: 'text', mandatory: true, help: 'Follows the Projects Director', usedIn: 'Cover' },
  { id: 'D11', group: 'doc', label: 'Approved By – Designation', type: 'text', mandatory: true, usedIn: 'Cover' },
  { id: 'H01', group: 'doc', section: 'Amendment Record', label: 'Amendment Record', type: 'revisions', mandatory: true, help: 'Dates as DD.MM.YYYY', usedIn: 'Document Control page' },

  { id: 'K01', group: 'people', section: 'Management', label: 'Projects Director', type: 'person', mandatory: false, help: 'Follows Approved By on the cover', usedIn: 'Appendix 1' },
  { id: 'K02', group: 'people', label: 'Project Manager', type: 'person', mandatory: true, help: 'Follows Reviewed By on the cover', usedIn: 'Appendix 1' },
  { id: 'K07', group: 'people', label: 'Construction Managers', type: 'people', mandatory: false, usedIn: 'Appendix 1' },
  { id: 'K03', group: 'people', section: 'HSE Department', label: 'Corporate HSE Manager (Head Office)', type: 'person', mandatory: false, usedIn: 'Appendix 1' },
  { id: 'K04', group: 'people', label: 'Project HSE Manager', type: 'person', mandatory: true, help: 'Follows Initiated By on the cover', usedIn: 'Appendix 1' },
  { id: 'K05', group: 'people', label: 'Senior HSE Officers', type: 'persons', mandatory: false, personMax: 6, usedIn: 'Appendix 1' },
  { id: 'K06', group: 'people', label: 'HSE Officers', type: 'persons', mandatory: false, personMax: 10, usedIn: 'Appendix 1' },
  { id: 'K08', group: 'people', section: 'Site team', label: 'Engineers & Supervisors', type: 'people', mandatory: false, help: 'Superintendent, supervisor, foreman, charge hand…', usedIn: 'Appendix 1' },
  { id: 'K09', group: 'people', label: 'Other personnel', type: 'people', mandatory: false, help: 'e.g. First Aider, Nurse, Fire Marshal, Storekeeper. Listed in the contact table, not drawn in the chart', usedIn: 'Appendix 1 table' },

  { id: 'C01', group: 'reqs', section: 'Code of practice (table of contents column)', label: 'Code of Practice', type: 'code', mandatory: false, usedIn: 'Table of Contents, 2 Scope & Purpose' },
  { id: 'L01', group: 'reqs', section: 'Lists in the plan', label: 'Legislation (2. Scope & Purpose)', type: 'lines', mandatory: false, reset: LEGISLATION, extra: LEGISLATION_EXTRA, help: 'The code of practice line is added after these automatically', usedIn: '2 Scope & Purpose' },
  { id: 'S01', group: 'reqs', label: 'Safe Work Procedures (SWP)', type: 'lines', mandatory: false, reset: SWP, usedIn: '5.2' },
  { id: 'S02', group: 'reqs', label: 'HSE Standards (HSES)', type: 'lines', mandatory: false, reset: HSES, usedIn: '5.3' },
  { id: 'S03', group: 'reqs', label: 'Certificates of competence required', type: 'lines', mandatory: false, reset: COMPETENCE, usedIn: '8.4' },
  { id: 'T01', group: 'reqs', label: 'Permit to Work / Access Arrangements', type: 'permits', mandatory: false, usedIn: '8.17' },
  { id: 'T02', group: 'reqs', label: 'Permit application notice (hours)', type: 'number', mandatory: true, min: 1, maxN: 168, usedIn: '8.18' },
  { id: 'O01', group: 'reqs', section: 'Objectives and targets', label: 'HSE Objectives', type: 'lines', mandatory: false, reset: OBJECTIVES, numbered: true, usedIn: '9.1' },
  { id: 'O02', group: 'reqs', label: 'HSE Targets', type: 'lines', mandatory: false, reset: TARGETS, numbered: true, usedIn: '9.2' },
  { id: 'O03', group: 'reqs', label: 'Employee of the Month award (AED)', type: 'number', mandatory: false, min: 1, maxN: 100000, usedIn: '9.3' },

  { id: 'POL', group: 'policies', label: 'Policy statements', type: 'policies', mandatory: false, help: 'Each ticked policy is printed on its own page in Section 6. The four signed Oxypro policies (Rev.00, 28.02.2024) are built in; add a newer scan to replace one.', usedIn: '6 HSE Policy Statements' },

  { id: 'A02', group: 'appendix', section: 'Appendix 2: Project Risk Register', label: 'Risk Register pages (scans or screenshots)', type: 'images', mandatory: false, maxMB: 5, usedIn: 'Appendix 2' },
  { id: 'A02ref', group: 'appendix', label: 'Risk Register reference (when attached separately)', type: 'text', mandatory: false, max: 80, placeholder: 'e.g. OPEM-DXB-243-HS-RR-001', usedIn: 'Appendix 2' },
  { id: 'A03', group: 'appendix', section: 'Appendix 3: Environmental Impact Register', label: 'Environmental Impact Register pages', type: 'images', mandatory: false, maxMB: 5, usedIn: 'Appendix 3' },
  { id: 'A03ref', group: 'appendix', label: 'Environmental Impact Register reference (when attached separately)', type: 'text', mandatory: false, max: 80, usedIn: 'Appendix 3' },
  { id: 'E01', group: 'appendix', section: 'Emergency Contact Numbers (added, switch on under Plan Sections)', label: 'Emergency contacts', type: 'contacts', mandatory: false, usedIn: 'Appendix 4 (when switched on)' },

  { id: 'R09', group: 'branding', label: 'Company Logo', type: 'image', mandatory: false, maxMB: 2, help: 'Empty uses the Oxypro logo', usedIn: 'Header' },
  { id: 'R11', group: 'branding', label: 'Header Tagline', type: 'text', mandatory: false, max: 60, usedIn: 'Header' },
  { id: 'R12on', group: 'branding', label: 'Show page watermark', type: 'toggle', mandatory: false, usedIn: 'Every page' },
  { id: 'R12', group: 'branding', label: 'Page Watermark', type: 'image', mandatory: false, maxMB: 2, help: 'Empty uses the faint Oxypro mark. An uploaded image is faded automatically', usedIn: 'Every page' },

  { id: 'OFF', group: 'sections', label: 'Plan Sections to Include', type: 'sections', mandatory: false },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns an error message for an entry that is not allowed (format / range), or null. */
export function fieldError(f: FieldSpec, p: Project): string | null {
  const v: any = (p as any)[f.id];
  if (f.type === 'text' || f.type === 'longtext') {
    const s = String(v ?? '');
    if (f.max && s.length > f.max) return `Maximum ${f.max} characters (now ${s.length}).`;
    if (f.code && s !== '' && !PROJECT_CODE.test(s)) return /\s/.test(s) ? 'No spaces: use a hyphen instead, e.g. DXB-243.' : 'Use letters, numbers and single hyphens only, e.g. DXB-243.';
  }
  if (f.type === 'number') {
    const s = String(v ?? '').trim();
    if (s === '') return null;
    if (!/^\d+$/.test(s)) return 'Enter a whole number.';
    const n = +s;
    if ((f.min != null && n < f.min) || (f.maxN != null && n > f.maxN)) return `Enter a number from ${f.min} to ${f.maxN}.`;
  }
  if (f.type === 'dmy' && v && !parseDMY(v)) return 'Type the date as DD.MM.YYYY, e.g. 28.10.2026.';
  if (f.type === 'docbox') {
    if (p.D04 && !parseDMY(p.D04)) return 'Date: type it as DD.MM.YYYY, e.g. 28.10.2026.';
    if ((p.D01 || '').length > 60) return 'Document No.: maximum 60 characters.';
    if ((p.D03 || '').length > 6) return 'Revision: maximum 6 characters (e.g. 00, 01, A).';
  }
  if (f.type === 'person') {
    const e = (v?.email || '').trim();
    if (e && !EMAIL.test(e)) return 'Check the email address.';
  }
  if (f.type === 'people' || f.type === 'persons') {
    const bad = (v || []).findIndex((r: any) => r.email && !EMAIL.test(r.email.trim()));
    if (bad >= 0) return `Row ${bad + 1}: check the email address.`;
  }
  if (f.type === 'revisions') {
    const bad = (v || []).findIndex((r: any) => !String(r.rev || '').trim() || (r.date && !parseDMY(r.date)));
    if (bad >= 0) return `Row ${bad + 1}: fill in the Rev and type the date as DD.MM.YYYY.`;
  }
  return null;
}

export function isEmpty(f: FieldSpec, p: Project): boolean {
  const v: any = (p as any)[f.id];
  if (f.type === 'person') return !v?.name?.trim();
  if (Array.isArray(v)) return v.length === 0;
  return v == null || String(v).trim() === '';
}

export function allErrors(p: Project): { f: FieldSpec; msg: string }[] {
  const out: { f: FieldSpec; msg: string }[] = [];
  for (const f of FIELDS) {
    const m = fieldError(f, p);
    if (m) out.push({ f, msg: m });
  }
  return out;
}

export function missingMandatory(p: Project): FieldSpec[] {
  return FIELDS.filter((f) => f.mandatory && f.type !== 'sections' && isEmpty(f, p));
}

/** The cover boxes still empty (they print blank, for filling in by hand). */
export function emptyBoxes(p: Project): string[] {
  const out: string[] = [];
  if (!(p.D01 || '').trim()) out.push('Document No.');
  if (!(p.D03 || '').trim()) out.push('Revision');
  if (!(p.D04 || '').trim()) out.push('Date');
  return out;
}
