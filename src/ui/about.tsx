import { useEffect, useRef } from 'preact/hooks';
import { APP_NAME, APP_VERSION, APP_DATE, CREDIT, VERSION_LINE, CHANGES, WEB_URL, WEB_LIVE } from '../version';
import { CORRECTIONS } from '../content/hse';
import iconUrl from '../assets/icon-app.png?inline';

/** About this app: a panel that slides in from the right over the app; closes with ✕, Esc or a click outside. */
export function AboutPanel(props: { onClose: () => void; exportFolder: string | null; canPickFolder: boolean; onGo: (group: string) => void }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; back?.focus?.(); };
  }, []);
  return (
    <div class="panel-wrap" onClick={props.onClose}>
      <aside class="panel" role="dialog" aria-modal="true" aria-labelledby="about-title" onClick={(e) => e.stopPropagation()}>
        <header class="panel-head">
          <h2 id="about-title">About this app</h2>
          <button ref={closeBtn} class="panel-close" aria-label="Close About" title="Close (Esc)" onClick={props.onClose}>✕</button>
        </header>
        <div class="panel-body">
          <About exportFolder={props.exportFolder} canPickFolder={props.canPickFolder} onGo={(g) => { props.onClose(); props.onGo(g); }} />
        </div>
      </aside>
    </div>
  );
}

export function About(props: { exportFolder: string | null; canPickFolder: boolean; onGo: (group: string) => void }) {
  const go = (g: string, label: string) => <button class="linkbtn" onClick={() => props.onGo(g)}>{label}</button>;
  return (
    <div class="about">
      <div class="about-card">
        <img src={iconUrl} alt="" width={64} height={64} />
        <div>
          <div class="about-name">{APP_NAME}</div>
          <div class="about-ver">Version {APP_VERSION} · {APP_DATE}</div>
          <p class="about-tag">Project Health, Safety &amp; Environment Plan generator for Oxypro Electromechanical Work LLC projects, built on the company sample HSE Plan and laid out like the Project Quality Plan.</p>
        </div>
      </div>

      <section>
        <h2>What it does</h2>
        <p>You enter the project details once, or bring them in from the Oxypro Project Library, a PQP Maker project or the Projects Master List. {APP_NAME} writes the full Project HSE Plan from the company standard: cover with the Document No., Revision and Date boxes and the signature block, Document Control page and Amendment Record, table of contents with the code of practice chapters, Sections 1 to 9 with their numbering and wording, the four signed HSE policy statements, the incident investigation flowchart and the appendices: HSE organization chart, ISO 45001:2018 certificate, Project Risk Register and Environmental Impact Register (on landscape pages). You get an editable Word file and a PDF, both A4 with the Oxypro header and "Page X of Y" in the footer, the same format as the PQP.</p>
      </section>

      <section>
        <h2>How to use it</h2>
        <ol class="about-steps">
          <li>{go('plans', 'My HSE Plans')} lists every plan on this device with <b>Preview</b>, <b>Word</b> and <b>PDF</b> buttons. <b>New plan</b> starts one; <b>Import project</b> fills the project details from the Library, PQP Maker or the Master List.</li>
          <li>Fill in the groups on the left, from {go('project', '1. Project Information')} to {go('appendix', '7. Appendices')}. A red number shows how many entries are still empty or need fixing. Fields marked <span class="req">*</span> are required.</li>
          <li>Type the <b>Document No.</b>, <b>Revision</b> and <b>Date</b> under {go('doc', '3. Document Control')} to finalise the cover. Left empty, they print as blank boxes to fill in by hand.</li>
          <li>Untick any section you do not need under {go('sections', 'Plan Sections')}. The sections after it are renumbered.</li>
          <li>Open {go('review', 'Review')} to check the plan and see every page, then <b>Word</b>, <b>PDF</b>, <b>Print</b> or <b>Share</b> (email with the PDF attached{WEB_LIVE ? ', or a link' : ''}).</li>
          <li><b>Save</b> keeps the plan as a <b>.hsep</b> file named with the project number, name and revision, for example <i>DXB-101 - Sample Residential Tower (G+20) - HSE Plan - Rev 01.hsep</i>. <b>Open</b> brings it back; <b>Save as</b> keeps each revision in its own file.</li>
        </ol>
        <p class="about-note"><b>Load sample data</b> fills a plan with made-up test data, to see a finished HSE Plan.</p>
      </section>

      <section>
        <h2>Files and folders</h2>
        <ul>
          <li><b>Exports</b> are named <code>Document No. Rev NN - HSE Plan - Project name</code>, for example <code>OPEM-DXB-101-HS-PLN-001 Rev 01 - HSE Plan - Sample Residential Tower (G+20).pdf</code>. Without a Document No. yet, the project code is used.</li>
          <li><b>Export folder:</b> {props.canPickFolder
            ? <>exports are saved to <b>{props.exportFolder || 'your Downloads folder'}</b>. Change it with <b>Choose folder</b> under the export buttons, for example to the project's folder or the Samples folder.</>
            : <>on this browser exports go to your Downloads folder. In Edge or Chrome on a laptop you can choose a folder instead.</>}</li>
          <li><b>Plan files (.hsep)</b> hold everything you entered, including photos, logos and scans.</li>
        </ul>
      </section>

      <section>
        <h2>Sharing</h2>
        <ul>
          <li><b>Email with the PDF attached:</b> on iPhone, iPad and in Edge or Chrome on Windows, <b>Share</b> opens the share sheet (Outlook, Mail, Teams…). On a laptop, <b>Outlook email draft</b> saves an email file with the PDF already attached: open it and Outlook shows a new email ready to address and send.</li>
          <li><b>Link:</b> {WEB_LIVE ? <>Copy link makes a link to the web version that opens this plan for the person you send it to (text only: photos, logos and scans stay out of the link). They can preview it and download the PDF.</> : <>sharing by link works once the web version is published at <b>{WEB_URL.replace('https://', '').replace(/\/$/, '')}</b>. Until then, share the PDF.</>}</li>
        </ul>
      </section>

      <section>
        <h2>Your data</h2>
        <ul>
          <li>Everything stays on this device. There is no login and nothing is uploaded.</li>
          <li>Every plan is autosaved in this browser about a second after each change and listed under My HSE Plans.</li>
          <li>Browser storage can be cleared, so save important plans as .hsep files as well.</li>
          <li>The app works offline: open <b>HSE Plan Maker.html</b> from the app folder.</li>
          {WEB_LIVE && <li>Web version: <a href={WEB_URL} target="_blank" rel="noopener">{WEB_URL.replace('https://', '').replace(/\/$/, '')}</a>. In Edge or Chrome install it from the address bar; on iPhone and iPad use Share &gt; Add to Home Screen. Plans made in the web version stay in that browser: move them with Save and Open (.hsep files).</li>}
        </ul>
      </section>

      <section>
        <h2>The standard text</h2>
        <p>The plan follows the company sample "Project HSE Plan" (Rev 00, 26.06.2024) and is issued as its revision: a new plan starts as <b>Rev 01</b>, dated the day it is made, and the Amendment Record lists Rev 00 (26.06.2024, initial issue) and Rev 01. These changes were made in the revision:</p>
        <ul>{CORRECTIONS.map((c) => <li>{c}</li>)}</ul>
        <p>The registers use the risk criteria of the Oxypro Risk Assessment form OXY-QHSE-F-RA-01: Score = Likelihood × Severity; 1–4 LOW, 5–12 MEDIUM, 15–25 HIGH, with the residual risk brought to LOW or MEDIUM before work starts. In the Environmental Impact Register a score of 8 or more is a significant aspect.</p>
      </section>

      <section>
        <h2>What's new</h2>
        {CHANGES.map((c) => (
          <div class="about-change">
            <h3>Version {c.v} <span>{c.date}</span></h3>
            <ul>{c.items.map((i) => <li>{i}</li>)}</ul>
          </div>
        ))}
      </section>

      <div class="about-credit">
        <p>{CREDIT}</p>
        <p>{VERSION_LINE}</p>
        <p><b>About this app</b></p>
      </div>
    </div>
  );
}
