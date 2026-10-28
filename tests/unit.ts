// Rule checks: numbering, table of contents, imports, sanitising, Word and PDF output.
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import { buildDoc, numbering } from '../src/content/build';
import { makeDocx, bmName } from '../src/gen/docx';
import { makePdf, pageRange } from '../src/gen/pdf';
import { defaultSettings, testProject, newProject, sanitize, chaptersFor, migrate } from '../src/model/defaults';
import { parseDMY, outputBaseName, projectFileName } from '../src/model/format';
import { allErrors, emptyBoxes, riskIssues, envIssues } from '../src/model/fields';
import { riskRows, envRows, score, band, significant } from '../src/content/registers';
import { textOnly, emlDraft } from '../src/share';
import { readMasterList, parseProjectText, applyImport } from '../src/importers';
import { nodePlatform } from './node-platform';

let fails = 0;
const ok = (c: boolean, msg: string) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const s = defaultSettings();

// dates and names
ok(parseDMY('1.2.2026') === '01.02.2026', 'D.M.YYYY tidied');
ok(parseDMY('31.02.2026') === null, '31 Feb rejected');
const t = testProject(s);
ok(outputBaseName(t) === 'OPEM-DXB-101-HS-PLN-001 Rev 01 - HSE Plan - Sample Residential Tower (G+20)', 'export name');
ok(projectFileName(t) === 'DXB-101 - Sample Residential Tower (G+20) - HSE Plan - Rev 01.hsep', 'plan file name');
ok(outputBaseName({ ...t, D01: '' }).startsWith('DXB-101 Rev 01'), 'export name without Document No.');
ok(allErrors(t).length === 0, 'sample has no errors');
ok(allErrors({ ...t, D04: '2026-10-28' }).some((e) => e.f.id === 'DOCBOX'), 'ISO date in the box is flagged');
ok(emptyBoxes(newProject(s)).join() === 'Document No.', 'new plan: Document No. box empty, Rev and Date prefilled');

// numbering when sections are left out
const n0 = numbering(new Set());
ok(n0['app:org'] === 'Appendix 1' && n0['app:iso'] === 'Appendix 2' && n0['app:risk'] === 'Appendix 3' && n0['app:env'] === 'Appendix 4' && n0['app:contacts'] === 'Appendix 5', 'appendix numbers: ISO 45001 certificate is Appendix 2');
const n1 = numbering(new Set(['s5.2', 's8.3', 'app:risk']));
ok(n1['s5.3'] === '5.2' && n1['s8.4'] === '8.3' && n1['app:env'] === 'Appendix 3', 'renumbering after left-out sections');
ok(numbering(new Set(['s4']))['s5'] === '4', 'level-1 renumbering');
ok(!('app' in numbering(new Set(['app']))), 'appendices off');

// document model
const m = await buildDoc(t, s, nodePlatform);
ok(m.toc.rows.length === 49 + 5, 'toc rows (sections + appendices heading + 4 appendices)');
ok(m.toc.code === 'Dubai Code of Construction Safety Practice 2008', 'code column heading');
ok(m.toc.rows.find((r) => r.id === 's8.19')!.chap === 'Chapter 19', 'chapter from the sample');
const txt = JSON.stringify(m.blocks);
ok(!/\{\{/.test(txt), 'no token left in the text');
ok(txt.includes('Sample Residential Tower (G+20) project as per the contract documents'), 'project name in 2 Scope & Purpose');
ok(txt.includes('is attached in Appendix 1 of this project HSE plan'), 'appendix reference in 7.1');
ok(txt.includes('section 7.2 of this plan'), 'section reference in 5.1');
ok(txt.includes('approved by Dubai Municipality'), 'lifting authority for Dubai');
ok(txt.includes('500 AED'), 'award amount');
ok(!JSON.stringify(m).includes('M/s') && m.cover.parties.find((x) => x[0] === 'Client')![1] === 'Sample Developer LLC', 'no M/s. in the plan');
ok(m.cover.boxes.map((b) => b[1]).join('|') === 'OPEM-DXB-101-HS-PLN-001|01|28.10.2026', 'cover boxes');
ok(m.footerLeft === 'OPEM-DXB-101-HS-PLN-001  |  Rev.01  |  28.10.2026', 'footer');
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

// Appendix 2 ISO 45001 certificate, Appendices 3 and 4 registers (user requests 28 Oct 2026)
ok(txt.includes('certified to ISO\u00A045001:2018 by TUV Apex Standardization Certifications (Certificate No. CN031157). A copy of the certificate is attached in Appendix 2 of this project HSE plan.'), 'Section 5 refers to the certificate in Appendix 2');
ok(m.toc.rows.some((r) => r.title === 'Appendix 2: ISO 45001:2018 Certificate') && m.toc.rows.some((r) => r.title === 'Appendix 3: Project Risk Register') && m.toc.rows.some((r) => r.title === 'Appendix 4: Environmental Impact Register'), 'appendix titles in the table of contents');
ok(txt.includes('The Project Risk Register is attached separately to this Project HSE Plan.') && txt.includes('The Project HSE Manager keeps the Project Risk Register up to date as the project develops (refer Section 5.2).'), 'Appendix 3 sentences');
ok(txt.includes('The Environmental Impact Register is attached separately to this Project HSE Plan.') && txt.includes('The Project HSE Manager keeps the Environmental Impact Register up to date as the project develops (refer Section 5.2).'), 'Appendix 4 sentences');
const sects = m.blocks.filter((b) => b.t === 'sect');
ok(sects.length === 1 && (sects[0] as any).land === true, 'registers on landscape pages (one section change)');
ok(txt.includes('Mobilisation, site induction and work-area handover') && txt.includes('heat stress') && txt.includes('Refrigerant handled only by trained, certified technicians.'), 'register rows printed');
ok(riskRows().length === 33 && envRows().length === 17, 'standard registers: 33 risks, 17 aspects');
ok(riskIssues(riskRows()).length === 0 && envIssues(envRows()).length === 0, 'standard registers pass the checks');
ok(riskRows().every((r) => band(score(r.L2, r.S2))!.key !== 'HIGH' && score(r.L2, r.S2) <= score(r.L, r.S)), 'residual risk LOW or MEDIUM and not above the initial risk');
ok(band(4)!.key === 'LOW' && band(5)!.key === 'MEDIUM' && band(12)!.key === 'MEDIUM' && band(15)!.key === 'HIGH' && significant(8) && !significant(6), 'rating bands and significance');
const hi = { ...t, RR: [{ ...riskRows()[0], L2: 4, S2: 4 }] };
ok(allErrors(hi).some((e) => e.f.id === 'RR' && e.msg.includes('residual risk is HIGH')), 'residual HIGH flagged');
ok(allErrors({ ...t, A02mode: 'separate' as const, RR: [{ ...riskRows()[0], L: 0 }] }).length === 0, 'register rows not checked when not printed');
const sep = await buildDoc({ ...t, A02mode: 'separate' as const, A03mode: 'separate' as const }, s, nodePlatform);
ok(!sep.blocks.some((b) => b.t === 'sect') && JSON.stringify(sep.blocks).includes('The Environmental Impact Register is attached separately') && !JSON.stringify(sep.blocks).includes('Mobilisation, site induction'), 'attached separately: two sentences only, portrait');
const withContacts = await buildDoc({ ...t, OFF: [] }, s, nodePlatform);
const ws = withContacts.blocks.filter((b) => b.t === 'sect').map((b: any) => b.land);
ok(ws.join() === 'true,false', 'emergency contacts after the registers go back to portrait');
const isoOff = await buildDoc({ ...t, OFF: ['app:iso'] }, s, nodePlatform);
ok(JSON.stringify(isoOff.blocks).includes('A copy of the certificate is held by the Corporate HSE Department.') && isoOff.toc.rows.some((r) => r.title === 'Appendix 2: Project Risk Register'), 'certificate appendix off: renumbered and Section 5 says so');
ok(allErrors({ ...t, D04: '05.01.2027', D14: '05.01.2027', D15: '05.01.2027' }).some((e) => e.f.id === 'I01exp'), 'expired certificate flagged');
const mig = migrate({ ...newProject(s), appVersion: '1.0.2', A02: [{ name: 'x.png', type: 'image/png', dataUrl: 'data:image/png;base64,AAAA' }], A02mode: undefined, A03mode: undefined, H01: [{ rev: '00', date: '26.06.2024', desc: 'Initial issue (Oxypro Project HSE Plan)' }, { rev: '01', date: '27.10.2026', desc: 'Revised to the Oxypro standard format (same layout as the PQP); numbering and text corrected; project details added' }] }, s);
ok(mig.A02mode === 'scans' && mig.A03mode === 'register' && mig.RR.length === 33 && mig.H01[1].desc.includes('ISO 45001:2018 certificate'), 'plan from 1.0.2: scans kept, registers added, Rev 01 description updated');
const san = sanitize({ RR: [{ activity: 'X', L: 9, S: '3', controls: 5 }], A02mode: 'nope' }, s);
ok(san.RR.length === 1 && san.RR[0].L === 0 && san.RR[0].S === 3 && san.RR[0].controls === '5' && san.A02mode === 'register', 'register rows sanitised');
ok(!('RR' in textOnly(t)) && 'RR' in textOnly(hi) && textOnly(t).I01 === null, 'standard registers stay out of share links');

// PDF: page ranges and the end marks of every section
const pdf = await makePdf(m);
const missingPages = m.toc.rows.filter((r) => pdf.pages[r.id] == null || pdf.pages[r.end] == null).map((r) => r.id);
ok(missingPages.length === 0, 'every toc row has a start and end page ' + missingPages.join(','));
ok(m.toc.rows.every((r) => pdf.pages[r.end] >= pdf.pages[r.id]), 'end page not before start page');
ok(pageRange(pdf.pages, 's7.2', 'end:s7.2', true).includes('-'), '7.2 spans pages');
ok(pdf.pageCount > 40 && pdf.pageCount < 60, 'page count ' + pdf.pageCount);

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
ok((doc.match(/<w:sectPr>/g) || []).length === 2 && doc.includes('w:orient="landscape"') && !!zip.file('word/header2.xml') && !!zip.file('word/footer2.xml'), 'Word: landscape section with its own header and footer');
ok((doc.match(/<w:vMerge w:val="restart"\/>/g) || []).length >= 15, 'Word: merged register header cells');

// revision of the company sample
const np = newProject(s);
ok(np.D03 === '01' && np.H01.length === 2 && np.H01[0].rev === '00' && np.H01[0].date === '26.06.2024' && np.H01[1].rev === '01' && np.H01[1].date === np.D04 && np.D14 === np.D04 && np.D15 === np.D04, 'new plan is Rev 01 of the sample');
const old = migrate({ ...np, appVersion: '1.0.1', D03: '00', D04: '20.10.2026', H01: [{ rev: '00', date: '20.10.2026', desc: 'Initial Issue' }] }, s);
ok(old.D03 === '01' && old.H01.length === 2 && old.H01[1].date === '20.10.2026', 'untouched first issue from 1.0.1 becomes Rev 01');
const kept = migrate({ ...np, appVersion: '1.0.1', D03: '00', H01: [{ rev: '00', date: '20.10.2026', desc: 'First issue for approval' }] }, s);
ok(kept.D03 === '00' && kept.H01.length === 1, 'a typed record is kept');
const amend = JSON.stringify(m.front);
ok(amend.includes('26.06.2024') && amend.includes('Initial issue (Oxypro Project HSE Plan)') && amend.includes('Revised to the Oxypro standard format'), 'amendment record shows Rev 00 and Rev 01');

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
