export interface ImageData {
  name: string;
  type: string; // image/png | image/jpeg
  dataUrl: string;
  w?: number;
  h?: number;
}

export interface Person {
  name: string;
  email: string;
  phone: string;
}

export interface ExtraPerson extends Person {
  role: string;
}

/** Amendment record row. The date is typed as DD.MM.YYYY, like the cover boxes. */
export interface RevRow {
  rev: string;
  date: string;
  desc: string;
}

/** 8.17 Permit to Work / Access Arrangements */
export interface PermitRow {
  activity: string;
  inForce: string; // Y | N
  issuedBy: string;
}

/** Appendix 4 (added): emergency contact numbers */
export interface ContactRow {
  service: string;
  number: string;
}

/** Section 6 policy statements: the scans built into the app, or a newer scan added by the user. */
export interface PolicyRow {
  key: string;       // ohs | env | sus | welfare | custom-…
  title: string;
  ref: string;       // e.g. OXY-OHS-POL-01
  on: boolean;
  image: ImageData | null; // null = the scan built into the app (when there is one)
}

export type CodeKey = 'dubai' | 'abudhabi' | 'other' | 'none';

export interface Project {
  id: string;
  created: string;
  modified: string;
  appVersion: string;
  // 1. Project Information
  P01: string; P02: string; P04: string; P05: string; P07: string; P08: string[]; P13: string;
  // 2. Project Parties
  R01: string; R02: string; R02m: string; R03: string; R04: string; R05: string;
  R07: ImageData | null; R08: ImageData | null; R10: ImageData | null;
  // Branding (per project, from Settings)
  R09: ImageData | null; // null = default logo
  R11: string;
  R12on: boolean;
  R12: ImageData | null; // null = default watermark
  // 3. Document Control: the three cover boxes are typed by hand
  D01: string; // Document No.
  D03: string; // Revision
  D04: string; // Date (DD.MM.YYYY)
  D05: string; // Document Status
  D12: string; D13: string; D14: string; D15: string; D16: string; // Department, Owner, Implementation Date, Last Reviewed Date, Approved Authority
  D06: string; D07: string; D08: string; D09: string; D10: string; D11: string; // Initiated / Reviewed / Approved by
  H01: RevRow[];
  // 4. HSE Organization (Appendix 1)
  K01: Person;          // Projects Director
  K02: Person;          // Project Manager
  K03: Person;          // Corporate HSE Manager (Head Office)
  K04: Person;          // Project HSE Manager
  K05: Person[];        // Senior HSE Officers
  K06: Person[];        // HSE Officers
  K07: ExtraPerson[];   // Construction Managers
  K08: ExtraPerson[];   // Engineers & Supervisors
  K09: ExtraPerson[];   // Other personnel (first aider, nurse, fire marshal …): contact table only
  // 5. HSE Requirements
  C01: CodeKey;         // code of practice for the TOC column
  C01name: string;      // column heading
  CHAP: Record<string, string>; // section id -> chapter / CoP reference
  L01: string[];        // legislation (2. Scope & Purpose)
  S01: string[];        // Safe Work Procedures (5.2)
  S02: string[];        // HSE Standards (5.3)
  S03: string[];        // certificates of competence (8.4)
  T01: PermitRow[];     // 8.17 permits
  T02: string;          // 8.18 permit application notice (hours)
  O01: string[];        // 9.1 HSE Objectives
  O02: string[];        // 9.2 HSE Targets
  O03: string;          // 9.3 award amount (AED)
  // 6. HSE Policy Statements
  POL: PolicyRow[];
  // 7. Appendices
  A02: ImageData[]; A02ref: string; // Project Risk Register
  A03: ImageData[]; A03ref: string; // Environmental Impact Register
  E01: ContactRow[];    // Emergency contact numbers (added)
  // Sections switched off
  OFF: string[];
}

export interface Settings {
  companyName: string;
  companyShort: string;
  logo: ImageData | null;
  tagline: string;
  watermark: ImageData | null;
  watermarkOpacity: number;
  brandColor: string;
  font: string;
}
