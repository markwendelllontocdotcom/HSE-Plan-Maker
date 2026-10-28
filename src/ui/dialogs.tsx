import { useState } from 'preact/hooks';
import type { MasterRow } from '../importers';
import { WEB_LIVE, WEB_URL } from '../version';

/** Import project details: Library / PQP file, the Projects Master List, or a pasted Library link. */
export function ImportDialog(props: {
  onClose: () => void;
  onFile: () => void;
  onMaster: () => void;
  onLink: (link: string) => void;
  master: MasterRow[] | null;
  masterName: string;
  onPickMaster: (r: MasterRow) => void;
  error: string;
}) {
  const [link, setLink] = useState('');
  const [q, setQ] = useState('');
  if (props.master) {
    const rows = props.master.filter((r) => !q.trim() || `${r.no} ${r.fields.P02 || ''} ${r.fields.P01} ${r.fields.R01 || ''} ${r.emirate}`.toLowerCase().includes(q.trim().toLowerCase()));
    return (
      <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="imp-title">
        <div class="dialog wide">
          <h2 id="imp-title">Choose the project</h2>
          <p class="muted">{props.master.length} projects in {props.masterName}.</p>
          <input type="search" placeholder="Search by number, name, client or emirate" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} autoFocus />
          <ul class="master-list">
            {rows.map((r) => (
              <li><button class="master-row" onClick={() => props.onPickMaster(r)}>
                <span class="tag">{r.fields.P02 || r.no || '—'}</span>
                <span class="mname">{r.fields.P01}</span>
                <span class="muted">{[r.emirate, r.fields.R01, r.status].filter(Boolean).join(' · ')}</span>
              </button></li>
            ))}
            {!rows.length && <li class="muted">No project matches the search.</li>}
          </ul>
          <div class="dactions"><button class="btn" onClick={props.onClose}>Cancel</button></div>
        </div>
      </div>
    );
  }
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="imp-title">
      <div class="dialog wide">
        <h2 id="imp-title">Import project details</h2>
        <p>Bring in the project name, code, location, building, scope, client, consultants and contractors, so the HSE Plan matches the PQP and the other submissions. People, document control and the HSE lists you entered stay as they are.</p>
        <div class="imp-cards">
          <button class="imp-card" onClick={props.onFile}>
            <b>Project Library or PQP Maker file</b>
            <span>The file the Oxypro Project Library saves under "PQP details and file" (.pqp.json), or a PQP Maker project (.pqp). Also brings the cover photo and logos.</span>
          </button>
          <button class="imp-card" onClick={props.onMaster}>
            <b>Projects Master List (Excel)</b>
            <span>The "Oxypro - Projects Master List" workbook. Pick the project from the list.</span>
          </button>
        </div>
        <label class="imp-link">
          <b>Or paste the link from the Project Library</b>
          <span class="muted">In the Library: open the project, click "PQP details and file", then copy the "Open in PQP Maker" link.</span>
          <textarea rows={3} value={link} placeholder="https://…#library=…" onInput={(e) => setLink((e.target as HTMLTextAreaElement).value)} />
        </label>
        {props.error && <p class="err" role="alert">{props.error}</p>}
        <div class="dactions">
          <button class="btn" onClick={props.onClose}>Cancel</button>
          <button class="btn primary" disabled={!link.trim()} onClick={() => props.onLink(link.trim())}>Import from link</button>
        </div>
      </div>
    </div>
  );
}

/** Share: email with the PDF attached, or a link. */
export function ShareDialog(props: {
  name: string;
  fileName: string;
  canShareFile: boolean;
  onClose: () => void;
  onShareSheet: () => void;
  onEml: () => void;
  onMailto: () => void;
  onCopyLink: () => void;
  onEmailLink: () => void;
  note: string;
}) {
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="sh-title">
      <div class="dialog wide">
        <h2 id="sh-title">Share {props.name}</h2>
        <h3 class="sh-h">Email with the PDF attached</h3>
        <p class="muted">{props.fileName}</p>
        <div class="sh-opts">
          {props.canShareFile && <button class="btn primary" onClick={props.onShareSheet}>Share…<small>Outlook, Mail, Teams, WhatsApp…</small></button>}
          <button class={'btn' + (props.canShareFile ? '' : ' primary')} onClick={props.onEml}>Outlook email draft<small>Saves an email with the PDF attached: open it to send</small></button>
          <button class="btn" onClick={props.onMailto}>Email app<small>Saves the PDF, then opens a new email: attach the PDF</small></button>
        </div>
        <h3 class="sh-h">Share as a link</h3>
        {WEB_LIVE ? (
          <>
            <p class="muted">The link opens this plan in the web version of HSE Plan Maker, where it can be previewed and downloaded as a PDF. It carries the text only: photos, logos and scans stay out.</p>
            <div class="sh-opts">
              <button class="btn" onClick={props.onCopyLink}>Copy link</button>
              <button class="btn" onClick={props.onEmailLink}>Email the link</button>
            </div>
          </>
        ) : (
          <p class="muted">Sharing by link works once the web version is published at {WEB_URL.replace('https://', '').replace(/\/$/, '')}. Until then, share the PDF.</p>
        )}
        {props.note && <p class="sh-note" role="status">{props.note}</p>}
        <div class="dactions"><button class="btn" onClick={props.onClose}>Close</button></div>
      </div>
    </div>
  );
}
