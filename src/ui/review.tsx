import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Project, Settings } from '../model/types';
import type { FieldSpec } from '../model/fields';
import { emptyBoxes } from '../model/fields';
import { codeHeading, BUILTIN_POLICIES } from '../model/defaults';
import { projectCode } from '../model/format';
import { people } from '../content/build';
import { SECTIONS } from '../content/hse';
import { score, band, significant } from '../content/registers';
import { cachedPdf, pdfFor, type PdfEntry } from '../exporter';
import { isIOS } from '../print';

type Issue = { f: FieldSpec; msg: string };
const regLine = (mode: string, scans: number, rows: string) =>
  mode === 'register' ? rows : mode === 'scans' ? (scans ? `${scans} scanned page${scans > 1 ? 's' : ''}` : 'Scans chosen, none added yet') : 'Attached separately (the two sentences only)';
type Level = 'ok' | 'bad' | 'warn' | 'info';

export interface ReviewProps {
  p: Project;
  s: Settings;
  errors: Issue[];
  missing: FieldSpec[];
  leftOut: string[];
  fileName: string;
  dirtyFile: boolean;
  onGo: (group: string) => void;
  goTo: (f: FieldSpec) => void;
  onExport: (kind: 'word' | 'pdf') => void;
  onPrint: () => void;
  onShare: () => void;
  onSave: () => void;
}

/** Review: what still needs attention, the plan itself and the key details, before exporting, printing or sharing. */
export function Review(props: ReviewProps) {
  const { p, s } = props;
  const [pdf, setPdf] = useState<PdfEntry | null>(cachedPdf(p));
  const [building, setBuilding] = useState(!cachedPdf(p));
  const [failed, setFailed] = useState('');
  const run = useRef(0);

  const build = async () => {
    const n = ++run.current;
    setBuilding(true);
    setFailed('');
    await new Promise((r) => setTimeout(r, 60));
    try {
      const r = await pdfFor(p, s);
      if (n === run.current) setPdf(r);
    } catch (e: any) {
      console.error(e);
      if (n === run.current) setFailed(e?.message || String(e));
    } finally {
      if (n === run.current) setBuilding(false);
    }
  };
  useEffect(() => { if (!cachedPdf(p)) build(); else { setPdf(cachedPdf(p)); setBuilding(false); } }, [p.id, p.modified]);

  const off = new Set(p.OFF);
  const fieldLink = (f: FieldSpec) => <button class="linkbtn" onClick={() => props.goTo(f)}>{f.label}</button>;

  const checks: { level: Level; title: string; body?: ComponentChildren }[] = [];
  if (props.errors.length) checks.push({ level: 'bad', title: `${props.errors.length} ${props.errors.length === 1 ? 'entry needs' : 'entries need'} fixing before you can export, print or share`, body: <ul>{props.errors.map((e) => <li>{fieldLink(e.f)}: {e.msg}</li>)}</ul> });
  if (props.missing.length) checks.push({ level: 'warn', title: `${props.missing.length} required ${props.missing.length === 1 ? 'field is' : 'fields are'} empty. They print as placeholders such as [Project Name]`, body: <ul class="rv-inline">{props.missing.map((f) => <li>{fieldLink(f)}</li>)}</ul> });
  if (!props.errors.length && !props.missing.length) checks.push({ level: 'ok', title: 'All required fields are complete and every entry is allowed' });
  const boxes = emptyBoxes(p);
  checks.push(boxes.length
    ? { level: 'info', title: `Cover boxes left blank: ${boxes.join(', ')}. They print as empty boxes for filling in by hand`, body: <button class="linkbtn" onClick={() => props.onGo('doc')}>Type them under 3. Document Control</button> }
    : { level: 'ok', title: `Cover boxes: ${p.D01.trim()} · Rev ${p.D03.trim()} · ${p.D04.trim()}` });
  if (p.C01 !== 'none') {
    const empty = SECTIONS.filter((x) => !off.has(x.id) && !(x.parent && off.has(x.parent)) && !(p.CHAP[x.id] || '').trim());
    checks.push(empty.length
      ? { level: 'warn', title: `${empty.length} sections have no ${p.C01 === 'abudhabi' ? 'OSHAD-SF Code of Practice' : 'chapter'} in the table of contents`, body: <button class="linkbtn" onClick={() => props.onGo('reqs')}>Fill them in under 5. HSE Requirements</button> }
      : { level: 'ok', title: `Table of contents shows ${p.C01name || codeHeading(p.C01)}` });
  }
  if (!off.has('s6')) {
    const on = p.POL.filter((x) => x.on);
    const noScan = on.filter((x) => !x.image && !BUILTIN_POLICIES.includes(x.key));
    checks.push(noScan.length
      ? { level: 'info', title: `${noScan.map((x) => x.title || 'A policy').join(', ')}: no scan yet, so Section 6 says it is to be attached`, body: <button class="linkbtn" onClick={() => props.onGo('policies')}>Open 6. HSE Policy Statements</button> }
      : { level: 'ok', title: `${on.length} policy ${on.length === 1 ? 'statement' : 'statements'} printed in Section 6` });
  }
  checks.push(props.leftOut.length
    ? { level: 'info', title: `${props.leftOut.length} ${props.leftOut.length === 1 ? 'section is' : 'sections are'} left out`, body: <><ul class="rv-inline">{props.leftOut.map((t) => <li>{t}</li>)}</ul><button class="linkbtn" onClick={() => props.onGo('sections')}>Open Plan Sections</button></> }
    : { level: 'ok', title: 'Every section is included' });
  checks.push(props.fileName
    ? { level: props.dirtyFile ? 'warn' : 'ok', title: props.dirtyFile ? `${props.fileName} has changes that are not saved to the file yet` : `Saved as ${props.fileName}`, body: props.dirtyFile ? <button class="linkbtn" onClick={props.onSave}>Save now</button> : undefined }
    : { level: 'info', title: 'Kept in My HSE Plans on this device. Save a plan file too for the project records', body: <button class="linkbtn" onClick={props.onSave}>Save now</button> });

  const dash = (v: string | undefined | null, required = false) => (v && v.trim() ? v : <span class={required ? 'rv-missing' : 'rv-empty'}>{required ? 'Missing' : '—'}</span>);
  const signer = (name: string, des: string) => (name.trim() ? `${name}${des.trim() ? ' – ' + des : ''}` : '');
  const team = people(p);
  const last = p.H01[p.H01.length - 1];
  const blocks: { title: string; group: string; rows: [string, ComponentChildren][] }[] = [
    { title: 'Cover', group: 'project', rows: [
      ['Project', dash(p.P01, true)],
      ['Project Code & Number', dash(projectCode(p), true)],
      ['Location', dash([p.P05.trim(), p.P04, 'UAE'].filter(Boolean).join(', '))],
      ['Client', dash(p.R01, true)],
      ['Consultant', dash(p.R02, true)],
      ['Main Contractor', dash(p.R03, true)],
      ['MEP Contractor', dash(p.R04, true)],
      ['Cover photo', p.R10 ? 'Added' : <span class="rv-empty">Not added: the cover shows the photo box</span>],
    ] },
    { title: 'Document control', group: 'doc', rows: [
      ['Document No.', dash(p.D01)],
      ['Revision', dash(p.D03)],
      ['Date', dash(p.D04)],
      ['Status', dash(p.D05, true)],
      ['Initiated by', dash(signer(p.D06, p.D07), true)],
      ['Reviewed by', dash(signer(p.D08, p.D09), true)],
      ['Approved by', dash(signer(p.D10, p.D11), true)],
      ['Last amendment', last ? `Rev ${last.rev}, ${last.date || 'no date'}${last.desc ? ', ' + last.desc : ''}` : <span class="rv-missing">Missing</span>],
    ] },
    { title: 'HSE organization (Appendix 1)', group: 'people', rows: team.length ? team.map((x) => [x.role, dash(x.name)] as [string, ComponentChildren]) : [['Names', <span class="rv-empty">None yet</span>]] },
    { title: 'HSE requirements', group: 'reqs', rows: [
      ['Code of practice', p.C01 === 'none' ? 'No code column' : dash(p.C01name)],
      ['Legislation', `${p.L01.filter((x) => x.trim()).length} items`],
      ['Safe Work Procedures', `${p.S01.filter((x) => x.trim()).length}`],
      ['HSE Standards', `${p.S02.filter((x) => x.trim()).length}`],
      ['Permits', `${p.T01.filter((x) => x.activity.trim()).length} activities, applied ${p.T02 || '24'} hours ahead`],
      ['Objectives / targets', `${p.O01.filter((x) => x.trim()).length} / ${p.O02.filter((x) => x.trim()).length}`],
    ] },
    { title: 'Appendices', group: 'appendix', rows: [
      ['ISO 45001:2018 certificate', p.I01 ? `Newer scan added${p.I01no.trim() ? `, ${p.I01no.trim()}` : ''}` : `Built in, ${p.I01no.trim() || 'CN031157'}${p.I01exp.trim() ? `, expiry ${p.I01exp.trim()}` : ''}`],
      ['Project Risk Register', regLine(p.A02mode, p.A02.length, `${p.RR.length} activities, ${p.RR.filter((r) => band(score(r.L, r.S))?.key === 'HIGH').length} HIGH before controls, ${p.RR.filter((r) => band(score(r.L2, r.S2))?.key === 'HIGH').length || 'none'} HIGH after`)],
      ['Environmental Impact Register', regLine(p.A03mode, p.A03.length, `${p.ER.length} aspects, ${p.ER.filter((r) => significant(score(r.L, r.S))).length} significant`)],
    ] },
  ];

  const ready = !props.errors.length;
  return (
    <div class="review">
      <p class="lead">Check the HSE Plan here before it goes out. The preview is the PDF exactly as Export PDF saves it; the Word file has the same content.</p>
      <section class="rv-checks" aria-label="Checks">
        {checks.map((c) => (
          <div class={'rv-check rv-' + c.level}>
            <span class="rv-mark" aria-hidden="true">{c.level === 'ok' ? '✓' : c.level === 'bad' ? '✕' : c.level === 'warn' ? '!' : 'i'}</span>
            <div><div class="rv-title">{c.title}</div>{c.body && <div class="rv-body">{c.body}</div>}</div>
          </div>
        ))}
      </section>

      <section class="rv-preview" aria-label="Preview">
        <div class="rv-bar">
          <div>
            <h2>Preview</h2>
            <span class="rv-meta">{building ? 'Building…' : pdf ? `${pdf.pages} pages · built ${pdf.built.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
          </div>
          <div class="rv-acts">
            {pdf && !building && <a class="btn small" href={pdf.url} target="_blank" rel="noopener">Open in new tab</a>}
            <button class="btn small" onClick={build} disabled={building}>Refresh</button>
          </div>
        </div>
        {building ? (
          <div class="rv-frame rv-wait" role="status">Building the preview. This takes a few seconds.</div>
        ) : failed ? (
          <div class="rv-frame rv-wait rv-fail" role="alert">The preview could not be built: {failed}</div>
        ) : pdf ? (
          <iframe class="rv-frame" src={pdf.url + '#view=FitH'} title="HSE Plan preview" />
        ) : null}
        {isIOS && pdf && !building && <p class="help">On iPhone and iPad the preview may show only the first page. Tap Open in new tab to scroll through every page.</p>}
        <div class="rv-out">
          <button class="btn primary" onClick={() => props.onExport('word')} disabled={!ready}>Word (.docx)</button>
          <button class="btn" onClick={() => props.onExport('pdf')} disabled={!ready}>PDF</button>
          <button class="btn" onClick={props.onPrint} disabled={!ready}>Print</button>
          <button class="btn" onClick={props.onShare} disabled={!ready}>Share</button>
          {!ready && <span class="rv-note">Fix the entries listed above first.</span>}
        </div>
      </section>

      <section class="rv-details" aria-label="Key details">
        {blocks.map((b) => (
          <div class="rv-card">
            <div class="rv-cardhead"><h2>{b.title}</h2><button class="linkbtn" onClick={() => props.onGo(b.group)}>Edit</button></div>
            <dl>{b.rows.map(([k, v]) => <><dt>{k}</dt><dd>{v}</dd></>)}</dl>
          </div>
        ))}
      </section>
    </div>
  );
}
