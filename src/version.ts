export const APP_NAME = 'HSE Plan Maker';
export const APP_VERSION = '1.0.2';
export const APP_DATE = '28 Oct 2026';
/** Web address of the installable version (GitHub Pages). WEB_LIVE turns on share links once it is published. */
export const WEB_URL = 'https://markwendelllontocdotcom.github.io/MEP-HSE-Plan-Maker/';
export const WEB_LIVE = false;
export const PQP_URL = 'https://markwendelllontocdotcom.github.io/MEP-PQP-Maker/';
export const CREDIT = 'Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.';
export const VERSION_LINE = `Version ${APP_VERSION} (${APP_DATE})`;

/** Version history shown in the About panel (newest first). Keep README.txt in step. */
export const CHANGES: { v: string; date: string; items: string[] }[] = [
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
