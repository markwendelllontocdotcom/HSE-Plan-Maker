import { useEffect, useState } from 'preact/hooks';
import type { PlanInfo } from '../storage';
import type { PdfEntry } from '../exporter';
import type { Project } from '../model/types';
import { isIOS } from '../print';

export interface PlansProps {
  plans: PlanInfo[];
  currentId: string;
  busyId: string;
  onOpen: (id: string) => void;
  onNew: () => void;
  onImport: () => void;
  onOpenFile: () => void;
  onSample: () => void;
  onPreview: (id: string) => void;
  onWord: (id: string) => void;
  onPdf: (id: string) => void;
  onShare: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const when = (iso: string) => {
  const d = new Date(iso);
  return isNaN(+d) ? '' : d.toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** My HSE Plans: every plan created on this device, each with Preview, Word and PDF. */
export function Plans(props: PlansProps) {
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState('');
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu('');
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [menu]);
  const act = (fn: (id: string) => void, id: string) => () => { setMenu(''); fn(id); };
  const list = props.plans.filter((x) => !q.trim() || `${x.name} ${x.code} ${x.docNo}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div class="plans">
      <p class="lead">Every HSE Plan created on this device. Open one to edit it, or get its Preview, Word file or PDF straight from here.</p>
      <div class="plans-bar">
        <button class="btn primary" onClick={props.onNew}>New plan</button>
        <button class="btn" onClick={props.onImport}>Import project…</button>
        <button class="btn" onClick={props.onOpenFile}>Open plan file…</button>
        <button class="btn ghost" onClick={props.onSample}>Load sample data</button>
        {props.plans.length > 4 && <input class="plans-search" type="search" placeholder="Search plans" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} aria-label="Search plans" />}
      </div>
      {list.length === 0 ? (
        <div class="plans-empty">{props.plans.length ? 'No plan matches the search.' : 'No HSE Plans yet. Start a new plan or import a project from the Oxypro Project Library.'}</div>
      ) : (
        <ul class="plan-list">
          {list.map((x) => {
            const busy = props.busyId === x.id;
            const cur = x.id === props.currentId;
            return (
              <li key={x.id} class={'plan' + (cur ? ' current' : '')}>
                <div class="plan-main">
                  <button class="plan-name linkbtn" onClick={() => props.onOpen(x.id)} title="Open to edit">{x.name.trim() || 'Untitled project'}</button>
                  <div class="plan-meta">
                    {x.code && <span class="tag">{x.code}</span>}
                    <span>{x.docNo.trim() || <i>No Document No. yet</i>}</span>
                    <span>Rev {x.rev.trim() || '–'}</span>
                    {x.date && <span>{x.date}</span>}
                    <span class="muted">Edited {when(x.modified)}</span>
                    {cur && <span class="pill on">Open now</span>}
                  </div>
                </div>
                <div class="plan-acts">
                  <button class="btn small" disabled={busy} onClick={() => props.onPreview(x.id)}>Preview</button>
                  <button class="btn small primary" disabled={busy} onClick={() => props.onWord(x.id)}>Word</button>
                  <button class="btn small primary" disabled={busy} onClick={() => props.onPdf(x.id)}>PDF</button>
                  <button class="btn small" disabled={busy} onClick={() => props.onShare(x.id)}>Share</button>
                  <div class="more">
                    <button class="btn small ghost" aria-haspopup="menu" aria-expanded={menu === x.id} onClick={() => setMenu(menu === x.id ? '' : x.id)}>More ▾</button>
                    {menu === x.id && (
                      <div class="more-menu" role="menu">
                        <button role="menuitem" class="btn small ghost" onClick={act(props.onOpen, x.id)}>Open to edit</button>
                        <button role="menuitem" class="btn small ghost" onClick={act(props.onDuplicate, x.id)}>Duplicate</button>
                        <button role="menuitem" class="btn small ghost danger" onClick={act(props.onDelete, x.id)}>Delete…</button>
                      </div>
                    )}
                  </div>
                  {busy && <span class="plan-busy" role="status">Working…</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Full-screen preview of any plan, with its downloads. */
export function PreviewModal(props: { plan: Project; pdf: PdfEntry | null; failed: string; onClose: () => void; onWord: () => void; onPdf: () => void; onPrint: () => void; onShare: () => void; onOpen: () => void }) {
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="pv-title" onClick={props.onClose}>
      <div class="preview" onClick={(e) => e.stopPropagation()}>
        <header class="pv-head">
          <div>
            <h2 id="pv-title">{props.plan.P01.trim() || 'Untitled project'}</h2>
            <span class="rv-meta">{props.pdf ? `${props.pdf.pages} pages` : props.failed ? '' : 'Building the preview…'}</span>
          </div>
          <div class="pv-acts">
            <button class="btn small" onClick={props.onOpen}>Open to edit</button>
            <button class="btn small primary" onClick={props.onWord} disabled={!props.pdf}>Word</button>
            <button class="btn small primary" onClick={props.onPdf} disabled={!props.pdf}>PDF</button>
            <button class="btn small" onClick={props.onPrint} disabled={!props.pdf}>Print</button>
            <button class="btn small" onClick={props.onShare} disabled={!props.pdf}>Share</button>
            {props.pdf && <a class="btn small" href={props.pdf.url} target="_blank" rel="noopener">New tab</a>}
            <button class="panel-close" aria-label="Close preview" onClick={props.onClose}>✕</button>
          </div>
        </header>
        {props.failed ? <div class="rv-frame rv-wait rv-fail" role="alert">The preview could not be built: {props.failed}</div>
          : props.pdf ? <iframe class="pv-frame" src={props.pdf.url + '#view=FitH'} title="HSE Plan preview" />
          : <div class="rv-frame rv-wait" role="status">Building the preview. This takes a few seconds.</div>}
        {isIOS && props.pdf && <p class="help">On iPhone and iPad tap New tab to scroll through every page.</p>}
      </div>
    </div>
  );
}
