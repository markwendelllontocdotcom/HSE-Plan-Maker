import type { Project, Settings, Person, PolicyRow, PermitRow, ContactRow, CodeKey } from './types';
import { APP_VERSION } from '../version';
import { todayDMY } from './format';
import { SECTIONS } from '../content/hse';

export const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
export const DISCIPLINES = ['HVAC', 'Plumbing & Drainage', 'Electrical', 'Fire Fighting', 'Fire Alarm', 'ELV', 'LPG', 'Civil', 'Structural', 'Fit-out'];
export const ROLES = ['Main Contractor', 'MEP Subcontractor', 'Specialist Subcontractor'];
export const STATUSES = ['Draft', 'For Approval', 'Approved', 'Approved as Noted', 'Revise & Resubmit'];

/** Code of practice shown in the fourth column of the table of contents (sample: "Delete as appropriate"). */
export const CODE_OPTIONS: { key: CodeKey; label: string; heading: string }[] = [
  { key: 'dubai', label: 'Dubai Code of Construction Safety Practice 2008', heading: 'Dubai Code of Construction Safety Practice 2008' },
  { key: 'abudhabi', label: 'Abu Dhabi OSHAD-SF (Codes of Practice)', heading: 'AD OSHAD-SF v3 (Code of Practice)' },
  { key: 'other', label: 'Other code (type the heading)', heading: 'Code of Practice' },
  { key: 'none', label: 'None (no code column)', heading: '' },
];

/** Chapter references for a code: the sample's Dubai chapters; the others start empty for the user to fill. */
export function chaptersFor(code: CodeKey): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of SECTIONS) out[s.id] = code === 'dubai' ? s.dubai : s.dubai === 'N/A' ? 'N/A' : '';
  out['app'] = 'N/A';
  return out;
}
export const codeForEmirate = (e: string): CodeKey => (e === 'Abu Dhabi' ? 'abudhabi' : 'dubai');
export const codeHeading = (k: CodeKey) => CODE_OPTIONS.find((o) => o.key === k)?.heading || '';

/** 2. Scope & Purpose: legislation list of the sample. The code of practice line follows the code chosen. */
export const LEGISLATION = [
  'UAE Code of Safety practice, EPSS and other applicable local regulations.',
  "Ministry of Labor and Social Affairs - 'Federal Law No. 8, 1980'",
  "Ministry of Labor and Social Affairs - 'Ministerial Order No. (32) 1982'",
  'Federal Law No. 24 of 1999, ‘Concerning Environmental Protection and Development’',
  'UAE Federal Regulations (Issued by Federal Environmental agency) Regulation for Assessment of Environmental effects of Installation. Regulation for Handling Hazardous materials, Hazardous wastes and medical wastes. Regulations for Insecticides and Agricultural additives and fertilizers.',
];
/** Current UAE references that can be added from the list (not in the sample). */
export const LEGISLATION_EXTRA = [
  'Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations',
  'Ministerial Resolution No. 44 of 2022 on Occupational Health and Safety and Labour Accommodation',
];
export function codeLine(p: Pick<Project, 'C01' | 'C01name'>): string {
  if (p.C01 === 'dubai') return 'Dubai Code of Construction Safety Practice, 2008';
  if (p.C01 === 'abudhabi') return 'Abu Dhabi Occupational Safety and Health System Framework (OSHAD-SF) and its Codes of Practice';
  if (p.C01 === 'other') return (p.C01name || '').trim();
  return '';
}

export const SWP = [
  'SWP 001 - General HSE Requirements', 'SWP 002 - Hazard Identification & Risk Assessment', 'SWP 003 - Environmental Management',
  'SWP 004 - Lifting Operations', 'SWP 005 - Office Safety', 'SWP 006 - Fall Protection & Prevention', 'SWP 007 - Scaffolding',
  'SWP 008 - Work in Proximity of Water', 'SWP 009 - Plant, Tools & Equipment', 'SWP 010 - Fire Safety', 'SWP 011 - Electricity',
  'SWP 012 - Material Storage, Handling & Movement', 'SWP 013 - Working in Confined Spaces', 'SWP 014 - Access & Egress', 'SWP 015 - COSHH',
  'SWP 016 - Lock Out / Tag Out', 'SWP 017 - Mobile Plant & Vehicles', 'SWP 018 - Incident Reporting', 'SWP 019 - Emergency Management',
  'SWP 020 - Personal Safety Equipment & PPE', 'SWP 021 - Welfare Facilities & First Aid', 'SWP 022 - Heat Stress Prevention',
];
export const HSES = [
  'HSES 001 - Mobile Elevated Work Platforms (MEWPs)', 'HSES 002 - Storage of Combustible Materials', 'HSES 003 - Ladders & Steps',
  'HSES 004 - Heat Stress', 'HSES 005 - PPE Guidelines', 'HSES 006 - Mobile Aluminium Scaffold Towers', 'HSES 007 - Hot Works',
  'HSES 008 - Safety Glove Selection', 'HSES 009 - Abrasive Wheels Cutting & Grinding Equipment', 'HSES 010 - Manual Handling',
  'HSES 011 - Mast Climber Work Platforms (MCWPs)', 'HSES 012 - Working Safely in Excavations', 'HSES 013 - BMU Window Cradle Lift',
  'HSES 014 - Fall Protection', 'HSES 015 - Safety Clearance and Escalation Procedures', 'HSES 016 - Safety Communication',
  'HSES 017 - Noise Control', 'HSES 018 - Safety Signage', 'HSES 019 - Hand Tool Safety', 'HSES 020 - Power Tool Safety', 'HSES 021 - Confined Space Work',
];
export const COMPETENCE = ['Electrical Switching', 'Confined Space Supervisor', 'MEWP Operator', 'Forklift Operator', 'Fire Marshal', 'Banksman / Rigger', 'MCWP Operator', 'First Aid'];

export function defaultPermits(co = 'Oxypro'): PermitRow[] {
  const mc = 'Main Contractor';
  return [
    { activity: 'Working in Confined Spaces', inForce: 'Y', issuedBy: mc },
    { activity: 'Hot Works', inForce: 'Y', issuedBy: mc },
    { activity: 'Electrical Work Permit for 220v / 380v Equipment', inForce: 'Y', issuedBy: mc },
    { activity: 'LV Access / Permit to Work', inForce: 'Y', issuedBy: mc },
    { activity: 'Permit to Make Live', inForce: 'Y', issuedBy: co },
    { activity: 'High Pressure Testing', inForce: 'Y', issuedBy: mc },
    { activity: `Excavation (Not in ${co}’s scope)`, inForce: 'Y', issuedBy: mc },
    { activity: 'Permit to Operate a Mobile Crane', inForce: 'Y', issuedBy: mc },
    { activity: 'Permit to Remove Safety Barrier', inForce: 'Y', issuedBy: mc },
  ];
}

export const OBJECTIVES = ['Prevent occupational injuries at project site', 'Prevent occupational illnesses at project site', 'Prevent environmental incidents at project site'];
export const TARGETS = [
  'Target Project Lost Time Injury Frequency (LTIF) below 0.01',
  'Target Project MTC/RWC Accident Frequency Rate (AFR) below 3.5',
  'Target Project First Aid Case Accident Frequency Rate (AFR) below 10.5',
  'Target a 1 Ton reduction in general waste through 3rd and 4th Project Quarter',
  '100% HSE inductions completed for all {{CO}} personnel and sub-contractors',
  'Supervisors to conduct weekly HSE TBT.',
  'Complete Quarterly HSE Audits and target close out of NCRs within 7 days.',
];

/** Section 6: the four signed policy statements of the sample (Rev.00, 28.02.2024) are built in. */
export const BUILTIN_POLICIES = ['ohs', 'env', 'sus', 'welfare'];
export function defaultPolicies(): PolicyRow[] {
  return [
    { key: 'ohs', title: 'Occupational Health and Safety Policy Statement', ref: 'OXY-OHS-POL-01', on: true, image: null },
    { key: 'env', title: 'Environmental Policy Statement', ref: 'OXY-ENV-POL-01', on: true, image: null },
    { key: 'sus', title: 'Sustainability Policy Statement', ref: 'OXY-SUS-POL-01', on: true, image: null },
    { key: 'welfare', title: 'Worker Welfare Management Policy Statement', ref: 'OXY-WW-POL-01', on: true, image: null },
  ];
}

/** Appendix 4 (added): UAE emergency numbers plus the project's own. */
export function defaultContacts(): ContactRow[] {
  return [
    { service: 'Police', number: '999' },
    { service: 'Ambulance', number: '998' },
    { service: 'Civil Defence (Fire)', number: '997' },
    { service: 'Site Emergency Contact Number', number: '' },
    { service: 'Project HSE Manager', number: '' },
    { service: 'Site First Aider / Nurse', number: '' },
    { service: 'Nearest Hospital / Clinic', number: '' },
  ];
}

export const DEFAULT_TAGLINE = 'THE COMPLETE SOLUTION FOR BUILDING SERVICES';
export const DEFAULT_COMPANY = 'OXYPRO ELECTROMECHANICAL WORK LLC';

export function defaultSettings(): Settings {
  return {
    companyName: DEFAULT_COMPANY,
    companyShort: 'Oxypro',
    logo: null,
    tagline: DEFAULT_TAGLINE,
    watermark: null,
    watermarkOpacity: 0.08,
    brandColor: '#D72025',
    font: 'Calibri',
  };
}

const person = (name = ''): Person => ({ name, email: '', phone: '' });

export function uid(): string {
  return 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function newProject(s: Settings): Project {
  const now = new Date().toISOString();
  const today = todayDMY();
  return {
    id: uid(), created: now, modified: now, appVersion: APP_VERSION,
    P01: '', P02: '', P04: 'Dubai', P05: '', P07: '', P08: [], P13: '',
    R01: '', R02: '', R02m: '', R03: '', R04: s.companyName, R05: 'MEP Subcontractor',
    R07: null, R08: null, R10: null,
    R09: s.logo, R11: s.tagline, R12on: true, R12: s.watermark,
    D01: '', D03: '00', D04: today, D05: 'Draft',
    D12: 'HSE Department', D13: 'HSE Department', D14: today, D15: today, D16: 'Projects Head',
    D06: '', D07: 'HSE Manager', D08: '', D09: 'Project Manager', D10: '', D11: 'Projects Head',
    H01: [{ rev: '00', date: today, desc: 'Initial Issue' }],
    K01: person(), K02: person(), K03: person(), K04: person(), K05: [person()], K06: [person()], K07: [], K08: [], K09: [],
    C01: 'dubai', C01name: codeHeading('dubai'), CHAP: chaptersFor('dubai'),
    L01: [...LEGISLATION], S01: [...SWP], S02: [...HSES], S03: [...COMPETENCE],
    T01: defaultPermits(s.companyShort || 'Oxypro'), T02: '24',
    O01: [...OBJECTIVES], O02: [...TARGETS], O03: '500',
    POL: defaultPolicies(),
    A02: [], A02ref: '', A03: [], A03ref: '',
    E01: defaultContacts(),
    OFF: ['app:contacts'],
  };
}

/** Fictitious test data for checking the generated plan (the sample project used by the PQP Maker samples). */
export function testProject(s: Settings): Project {
  const p = newProject(s);
  return {
    ...p,
    P01: 'Sample Residential Tower (G+20)', P02: 'DXB-101', P04: 'Dubai', P05: 'Plot 000-000, Sample Area',
    P07: 'Supply, installation, testing and commissioning of MEP works.',
    P08: ['HVAC', 'Plumbing & Drainage', 'Electrical', 'Fire Fighting'], P13: 'G+20+R',
    R01: 'Sample Developer LLC', R02: 'Sample Engineering Consultants', R03: 'Sample Main Contractor LLC',
    D01: 'OPEM-DXB-101-HS-PLN-001', D03: '00', D04: '28.10.2026', D05: 'For Approval', D14: '28.10.2026', D15: '28.10.2026',
    D06: 'D. Sample', D08: 'C. Sample', D10: 'H. Sample',
    H01: [{ rev: '00', date: '28.10.2026', desc: 'First issue for approval' }],
    K01: person('H. Sample'), K02: person('C. Sample'), K03: person('L. Sample'), K04: person('D. Sample'),
    K05: [person('M. Sample')], K06: [person('N. Sample'), person('O. Sample')],
    K07: [{ role: 'Construction Manager', name: 'I. Sample', email: '', phone: '' }],
    K08: [{ role: 'Site Engineer – Electrical', name: 'J. Sample', email: '', phone: '' }, { role: 'Foreman – Mechanical', name: 'K. Sample', email: '', phone: '' }],
    K09: [{ role: 'First Aider', name: 'P. Sample', email: '', phone: '' }],
  };
}

/** True when version a (e.g. "1.3.2") is older than b; a missing version counts as older. */
export function older(a: unknown, b: string): boolean {
  const x = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0), y = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0);
  return false;
}

/** Fills anything a project saved by another version (or a partial import) lacks. */
export function migrate(p: any, s: Settings): Project {
  const base = newProject(s);
  const out: any = { ...base, ...p };
  const pers = (x: any): Person => ({ name: x?.name || '', email: x?.email || '', phone: x?.phone || '' });
  for (const k of ['K01', 'K02', 'K03', 'K04']) out[k] = pers(out[k]);
  for (const k of ['K05', 'K06']) out[k] = Array.isArray(out[k]) ? out[k].map(pers) : [pers(null)];
  for (const k of ['K07', 'K08', 'K09']) if (!Array.isArray(out[k])) out[k] = [];
  for (const k of ['P08', 'L01', 'S01', 'S02', 'S03', 'O01', 'O02', 'A02', 'A03', 'OFF', 'H01', 'T01', 'E01', 'POL']) if (!Array.isArray(out[k])) out[k] = (base as any)[k];
  out.CHAP = { ...chaptersFor(out.C01 || 'dubai'), ...(out.CHAP || {}) };
  const pol = defaultPolicies();
  out.POL = [...pol.map((d) => ({ ...d, ...(out.POL.find((x: PolicyRow) => x.key === d.key) || {}) })), ...out.POL.filter((x: PolicyRow) => !BUILTIN_POLICIES.includes(x.key))];
  out.appVersion = APP_VERSION;
  return out as Project;
}

const IMG_RE = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;
/** Coerces a plan read from a file or a link to the shapes the app expects (wrong types are dropped). */
export function sanitize(x: any, s: Settings): Project {
  const base: any = newProject(s);
  const src = x && typeof x === 'object' ? x : {};
  const out: any = {};
  const s1 = (v: any, max = 4000) => (typeof v === 'string' || typeof v === 'number' ? String(v).slice(0, max) : '');
  const img = (v: any) => (v && typeof v.dataUrl === 'string' && IMG_RE.test(v.dataUrl) ? { name: s1(v.name, 150) || 'Image', type: v.dataUrl.slice(5, v.dataUrl.indexOf(';')), dataUrl: v.dataUrl, ...(+v.w > 0 && +v.h > 0 ? { w: +v.w, h: +v.h } : {}) } : null);
  const pers = (v: any) => ({ name: s1(v?.name, 150), email: s1(v?.email, 150), phone: s1(v?.phone, 60) });
  const rowsOf = (v: any, keys: string[]) => (Array.isArray(v) ? v.slice(0, 200).filter((r) => r && typeof r === 'object').map((r) => Object.fromEntries(keys.map((k) => [k, s1(r[k], 1000)]))) : null);
  for (const k of Object.keys(base)) {
    const b = base[k], v = src[k];
    if (v === undefined) { out[k] = b; continue; }
    if (['R07', 'R08', 'R09', 'R10', 'R12'].includes(k)) out[k] = img(v);
    else if (['A02', 'A03'].includes(k)) out[k] = Array.isArray(v) ? v.map(img).filter(Boolean).slice(0, 40) : [];
    else if (['K01', 'K02', 'K03', 'K04'].includes(k)) out[k] = pers(v);
    else if (['K05', 'K06'].includes(k)) out[k] = Array.isArray(v) ? v.slice(0, 20).map(pers) : b;
    else if (['K07', 'K08', 'K09'].includes(k)) out[k] = Array.isArray(v) ? v.slice(0, 60).map((r: any) => ({ role: s1(r?.role, 150), ...pers(r) })) : b;
    else if (k === 'H01') out[k] = rowsOf(v, ['rev', 'date', 'desc']) || b;
    else if (k === 'T01') out[k] = rowsOf(v, ['activity', 'inForce', 'issuedBy']) || b;
    else if (k === 'E01') out[k] = rowsOf(v, ['service', 'number']) || b;
    else if (k === 'POL') out[k] = Array.isArray(v) ? v.slice(0, 20).filter((r: any) => r && typeof r === 'object').map((r: any) => ({ key: s1(r.key, 40) || 'custom-' + uid(), title: s1(r.title, 200), ref: s1(r.ref, 80), on: !!r.on, image: img(r.image) })) : b;
    else if (k === 'CHAP') out[k] = v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).slice(0, 200).map(([a, c]) => [s1(a, 40), s1(c, 80)])) : b;
    else if (k === 'C01') out[k] = ['dubai', 'abudhabi', 'other', 'none'].includes(v) ? v : b;
    else if (Array.isArray(b)) out[k] = Array.isArray(v) ? v.filter((e: any) => typeof e === 'string').map((e: string) => e.slice(0, 1000)).slice(0, 200) : b;
    else if (typeof b === 'boolean') out[k] = !!v;
    else if (typeof b === 'string') out[k] = s1(v);
    else out[k] = b;
  }
  if (typeof src.id === 'string' && /^[\w-]{4,40}$/.test(src.id)) out.id = src.id;
  return migrate(out, s);
}
