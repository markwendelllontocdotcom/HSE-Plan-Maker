// Rule checks: numbering, table of contents, imports, sanitising, Word and PDF output.
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { buildDoc, numbering } from '../src/content/build';
import { makeDocx, bmName } from '../src/gen/docx';
import { makePdf, pageRange } from '../src/gen/pdf';
import { defaultSettings, testProject, newProject, sanitize, chaptersFor } from '../src/model/defaults';
import { parseDMY, outputBaseName, projectFileName } from '../src/model/format';
import { allErrors, emptyBoxes } from '../src/model/fields';
import { readMasterList, parseProjectText, applyImport } from '../src/importers';
import { emlDraft } from '../src/share';
import { nodePlatform } from './node-platform';

let fails = 0;
const ok = (c: boolean, msg: string) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const s = defaultSettings();

// dates and names
ok(parseDMY('1.2.2026') === '01.02.2026', 'D.M.YYYY tidied');
ok(parseDMY('31.02.2026') === null, '31 Feb rejected');
const t = testProject(s);
ok(outputBaseName(t) === 'OPEM-DXB-101-HS-PLN-001 Rev 00 - HSE Plan - Sample Residential Tower (G+20)', 'export name');
ok(projectFileName(t) === 'DXB-101 - Sample Residential Tower (G+20) - HSE Plan - Rev 00.hsep', 'plan file name');
ok(outputBaseName({ ...t, D01: '' }).startsWith('DXB-101 Rev 00'), 'export name without Document No.');
ok(allErrors(t).length === 0, 'sample has no errors');
ok(allErrors({ ...t, D04: '2026-10-28' }).some((e) => e.f.id === 'DOCBOX'), 'ISO date in the box is flagged');
ok(emptyBoxes(newProject(s)).join() === 'Document No.', 'new plan: Document No. box empty, Rev and Date prefilled');

// numbering when sections are left out
const n1 = numbering(new Set(['s5.2', 's8.3', 'app:risk']));
ok(n1['s5.3'] === '5.2' && n1['s8.4'] === '8.3' && n1['app:env'] === 'Appendix 2', 'renumbering after left-out sections');
ok(numbering(new Set(['s4']))['s5'] === '4', 'level-1 renumbering');
ok(!('app' in numbering(new Set(['app']))), 'appendices off');

// document model
const m = await buildDoc(t, s, nodePlatform);
ok(m.toc.rows.length === 49 + 4, 'toc rows (sections + appendices heading + 3 appendices)');
ok(m.toc.code === 'Dubai Code of Construction Safety Practice 2008', 'code column heading');
ok(m.toc.rows.find((r) => r.id === 's8.19')!.chap === 'Chapter 19', 'chapter from the sample');
const txt = JSON.stringify(m.blocks);
ok(!/\{\{/.test(txt), 'no token left in the text');
ok(txt.includes('Sample Residential Tower (G+20) project as per the contract documents'), 'project name in 2 Scope & Purpose');
ok(txt.includes('is attached in Appendix 1 of this project HSE plan'), 'appendix reference in 7.1');
ok(txt.includes('section 7.2 of this plan'), 'section reference in 5.1');
ok(txt.includes('approved by Dubai Municipality'), 'lifting authority for Dubai');
ok(txt.includes('500 AED'), 'award amount');
ok(m.cover.boxes.map((b) => b[1]).join('|') === 'OPEM-DXB-101-HS-PLN-001|00|28.10.2026', 'cover boxes');
ok(m.footerLeft === 'OPEM-DXB-101-HS-PLN-001  |  Rev.00  |  28.10.2026', 'footer');
const blank = await buildDoc({ ...t, D01: '', D03: '', D04: '' }, s, nodePlatform);
ok(blank.cover.boxes.every((b) => b[1] === '') && blank.footerLeft === 'Project HSE Plan', 'blank boxes print empty');
const ad = { ...t, P04: 'Abu Dhabi', C01: 'abudhabi' as const, C01name: 'AD OSHAD-SF v3 (Code of Practice)', CHAP: chaptersFor('abudhabi') };
const mad = await buildDoc(ad, s, nodePlatform);
ok(JSON.stringify(mad.blocks).includes('Abu Dhabi Occupational Safety and Health System Framework'), 'OSHAD line in legislation');
ok(mad.toc.rows.find((r) => r.id === 's8.19')!.chap === '', 'OSHAD chapters start empty');
ok(JSON.stringify(mad.blocks).includes('Abu Dhabi Civil Defence will perform'), 'civil defence for Abu Dhabi');
const none = await buildDoc({ ...t, C01: 'none' as const }, s, nodePlatform);
ok(none.toc.code === null, 'no code column');
const off = await buildDoc({ ...t, OFF: ['app:org'] }, s, nodePlatform);
ok(JSON.stringify(off.blocks).includes('is maintained by the Project HSE Department'), 'org chart appendix off: 7.1 says so');
const off7 = await buildDoc({ ...t, OFF: ['s7'] }, s, nodePlatform);
ok(!off7.blocks.some((b) => b.t === 'h' && (b.id === 's7.1' || b.id === 's7')) && off7.blocks.some((b) => b.t === 'h' && b.id === 's8' && b.num === '7.'), 'section 7 off: section 8 becomes 7');
ok(JSON.stringify(off7.blocks).includes('detailed in the project HSE organization.'), 'no reference to a left-out section number');

// PDF: page ranges and the end marks of every section
const pdf = await makePdf(m);
const missingPages = m.toc.rows.filter((r) => pdf.pages[r.id] == null || pdf.pages[r.end] == null).map((r) => r.id);
ok(missingPages.length === 0, 'every toc row has a start and end page ' + missingPages.join(','));
ok(m.toc.rows.every((r) => pdf.pages[r.end] >= pdf.pages[r.id]), 'end page not before start page');
ok(pageRange(pdf.pages, 's7.2', 'end:s7.2', true).includes('-'), '7.2 spans pages');
ok(pdf.pageCount > 30 && pdf.pageCount < 50, 'page count ' + pdf.pageCount);

// Word: parts, bookmarks for every PAGEREF, numbering instances
m.pages = pdf.pages;
const docx = await makeDocx(m);
const zip = await JSZip.loadAsync(docx);
const doc = await zip.file('word/document.xml')!.async('string');
const refs = [...doc.matchAll(/PAGEREF (\S+) \\h/g)].map((x) => x[1]);
const marks = new Set([...doc.matchAll(/w:bookmarkStart w:id="\d+" w:name="([^"]+)"/g)].map((x) => x[1]));
ok(refs.length >= m.toc.rows.length && refs.every((r) => marks.has(r)), `every PAGEREF has its bookmark (${refs.length})`);
const ids = [...doc.matchAll(/w:bookmarkStart w:id="(\d+)"/g)].map((x) => x[1]);
ok(new Set(ids).size === ids.length, 'bookmark ids unique');
ok(bmName('end:s8.17') === '_Es8_17', 'bookmark name');
const numXml = await zip.file('word/numbering.xml')!.async('string');
const used = new Set([...doc.matchAll(/<w:numId w:val="(\d+)"\/>/g)].map((x) => x[1]));
ok([...used].every((u) => numXml.includes(`<w:num w:numId="${u}">`)), 'every list number is defined');
ok(doc.includes('OPEM-DXB-101-HS-PLN-001') && doc.includes('Initiated By'), 'cover in Word');

// imports
const lib = parseProjectText(readFileSync('tests/fixtures/library-sample.pqp.json', 'utf8'), 'x');
ok(lib.fields.P02 === 'DXB-777' && lib.fields.K04?.name === 'HSE Sample' && lib.source === 'Oxypro Project Library', 'Library file mapped');
const applied = applyImport(newProject(s), lib.fields);
ok(applied.D06 === 'HSE Sample' && applied.D08 === 'PM Sample' && applied.D10 === 'PD Sample', 'signatures follow imported people');
const rows = await readMasterList(readFileSync('tests/fixtures/master-list-sample.xlsx'));
ok(rows.length === 2 && rows[0].fields.P02 === 'DXB-901' && rows[0].fields.P05 === 'Plot 111-222, Sample Community' && rows[0].fields.R02 === 'Sample Architects' && rows[0].fields.R02m === 'Sample MEP Consultants', 'Master List row 1');
ok(rows[1].fields.P04 === 'Abu Dhabi' && rows[1].fields.R02 === 'Sample Engineering' && !rows[1].fields.R02m, 'Master List row 2 (AUH, lead consultant na)');
let threw = false;
try { parseProjectText('{"format":"x"}', 'bad.json'); } catch { threw = true; }
ok(threw, 'unknown file refused');

// sanitising a plan from a file or link
const bad = sanitize({ P01: { x: 1 }, P08: ['HVAC', 5], K05: 'oops', R10: { dataUrl: 'javascript:alert(1)' }, POL: [{ key: 'ohs', on: 1 }], T01: [{ activity: 'A', inForce: 'Y', issuedBy: 3 }] }, s);
ok(bad.P01 === '' && bad.P08.join() === 'HVAC' && Array.isArray(bad.K05) && bad.R10 === null && bad.POL.length === 4 && bad.T01[0].issuedBy === '3', 'sanitize');

// email draft
const eml = emlDraft(new Uint8Array([37, 80, 68, 70]), 'a.pdf', t);
ok(eml.startsWith('X-Unsent: 1') && eml.includes('filename="a.pdf"') && eml.includes('JVBERg=='), 'email draft');

console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);
