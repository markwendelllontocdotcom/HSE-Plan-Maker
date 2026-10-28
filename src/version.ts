export const APP_NAME = 'HSE Plan Maker';
export const APP_VERSION = '1.0.6';
export const APP_DATE = '29 Oct 2026';
/** Web address of the installable version (GitHub Pages). WEB_LIVE turns on share links once it is published. */
export const WEB_URL = 'https://markwendelllontocdotcom.github.io/HSE-Plan-Maker/';
export const WEB_LIVE = true;
export const PQP_URL = 'https://markwendelllontocdotcom.github.io/MEP-PQP-Maker/';
export const CREDIT = 'Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.';
export const VERSION_LINE = `Version ${APP_VERSION} (${APP_DATE})`;

/** Version history shown in the About panel (newest first). Keep README.txt in step. */
export const CHANGES: { v: string; date: string; items: string[] }[] = [
  {
    v: '1.0.6',
    date: '29 Oct 2026',
    items: [
      'HSE plans are kept in HSE Plan Maker\'s own storage on the device. Before, HSE Plan Maker and PQP Maker opened in the same browser shared one storage, so My HSE Plans could list PQP projects. Plans made before move across by themselves the first time this version opens; PQP Maker\'s projects stay with PQP Maker.',
      'The web address opens the app whichever folder GitHub Pages is set to.',
    ],
  },
  {
    v: '1.0.5',
    date: '29 Oct 2026',
    items: [
      'Web version at markwendelllontocdotcom.github.io/HSE-Plan-Maker: open it in Edge or Chrome and install it from the address bar, or on iPhone and iPad use Share > Add to Home Screen. It works offline after the first open.',
      'Share > Copy link now works: the person you send it to opens the plan in the web version, previews it and downloads the PDF (text only: photos, logos and scans stay out of the link).',
    ],
  },
  {
    v: '1.0.4',
    date: '29 Oct 2026',
    items: [
      'From the Oxypro Project Library: the file its HSE button saves ("Save HSE Plan file") brings the project details and the cover photo you chose there. Use Import project > Project Library or PQP Maker file, or Open.',
      'The MEP Consultant comes across from the Library too, when it is a different firm from the Lead Consultant.',
    ],
  },
  {
    v: '1.0.3',
    date: '28 Oct 2026',
    items: [
      'Appendix 2 is the Oxypro ISO 45001:2018 certificate (TUV Apex, Certificate No. CN031157), built in. Section 5 refers to it. Add the new scan under 7. Appendices when the certificate is renewed; a plan dated after the expiry is flagged.',
      'Appendix 3 Project Risk Register: the two standard sentences, then the register on landscape pages, in the layout of the Oxypro Risk Assessment form: 5 x 5 risk criteria, initial and residual risk with LOW / MEDIUM / HIGH colours, control measures and the person responsible. It starts with the 32 steps of the Oxypro MEP Risk Assessment Master Reference and heat stress.',
      'Appendix 4 Environmental Impact Register: 17 environmental aspects of MEP works (waste, hazardous waste, spills, flushing water, refrigerants, dust, noise and more) with condition, significance, control measures, legal requirements and the person responsible.',
      'Both registers are edited per plan under 7. Appendices (add, move, remove, reset to the standard register). A row whose residual risk is still HIGH is flagged. Scanned pages, or the two sentences only, can be chosen instead.',
      'The incident investigation flowchart in 8.22 is the updated Oxypro flowchart.',
      'Emergency Contact Numbers, when switched on, are now Appendix 5. The Rev 01 amendment line names the certificate and the registers.',
    ],
  },
  {
    v: '1.0.2',
    date: '28 Oct 2026',
    items: [
      'Each plan is a revision of the company sample HSE Plan: it starts as Rev 01, dated the day it is made. The Amendment Record lists Rev 00 (26.06.2024, initial issue) and Rev 01 (the revision date, revised to the Oxypro standard format), and the Implementation and Last Reviewed dates follow the revision date.',
      'A plan saved earlier that still had the untouched first-issue record becomes Rev 01 the same way when it is opened.',
    ],
  },
  {
    v: '1.0.1',
    date: '28 Oct 2026',
    items: ['No "M/s." in the plan: the client, consultant, main contractor and MEP contractor print as typed on the cover and in Terms & Definitions. An "M/s." typed in front of a name is left out too.'],
  },
  {
    v: '1.0.0',
    date: '28 Oct 2026',
    items: [
      'First release: the Oxypro Project Health, Safety & Environment Plan from the company sample, in the same format as the Project Quality Plan (Oxypro header, cover with photo and signature block, table of contents, footer with Page X of Y).',
      'Cover boxes for the Document No., Revision and Date, typed by hand; left empty they print blank for filling in on the document.',
      'Table of contents with the page numbers and the Dubai Code of Construction Safety Practice 2008 chapters, or Abu Dhabi OSHAD-SF, another code or none.',
      'Project details from the Oxypro Project Library, a PQP Maker project or the Projects Master List (Excel), so every submission uses the same project information.',
      'My HSE Plans: every plan created on this device with Preview, Word and PDF buttons.',
      'Save, Save as, Open, Print, Review, Export Word and PDF, and Share: email with the PDF attached, or a link.',
    ],
  },
];
