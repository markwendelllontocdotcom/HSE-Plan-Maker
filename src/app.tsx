import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { Project, Settings } from './model/types';
import { FIELDS, GROUPS, fieldError, allErrors, missingMandatory, emptyBoxes, type FieldSpec } from './model/fields';
import { defaultSettings, newProject, testProject, migrate, sanitize, uid, codeForEmirate, chaptersFor, codeHeading } from './model/defaults';
import { outputBaseName, projectCode, PLAN_EXT } from './model/format';
import { sectionUnits, numbering } from './content/build';
import { store, moveFromShared, type PlanInfo } from './storage';
import { saveProjectFile, pickFile, parsePlanFile, download, type Handle } from './files';
import { parseProjectText, readLibraryLink, readMasterList, applyImport, isBlankPlan, hasLibraryHash, hasShareHash, coverFromBlob, IMPORT_LABELS, type Incoming, type MasterRow } from './importers';
import { exportWord, exportPdf, pdfFor, deliver, type PdfEntry } from './exporter';
import { printPdf, openPdfTab, isIOS } from './print';
import { canShareFile, shareFile, emlDraft, mailSubject, mailBody, shareLink, readShareHash } from './share';
import { canPickFolder, loadExportDir, chooseExportDir, forgetExportDir, ensureWritable, wasAsked, markAsked } from './exportdir';
import { ASSET_URLS } from './platform-browser';
import { Row, TextInput, TextArea, Select, Multi, Toggle, ImagePick, Images, PersonInput, People, Persons, Revisions, DmyInput, DocBox, Lines, Permits, Contacts, Policies, CodeEditor } from './ui/controls';
import { OrgPreview } from './ui/orgpreview';
import { RegModePick, RiskRows, EnvRows } from './ui/registers';
import { AboutPanel } from './ui/about';
import { Review } from './ui/review';
import { Plans, PreviewModal } from './ui/plans';
import { ImportDialog, ShareDialog } from './ui/dialogs';
import { APP_NAME, CREDIT, VERSION_LINE } from './version';
import iconUrl from './assets/icon-app.png?inline';

type Dialog = { title: string; body: ComponentChildren; actions: { label: string; primary?: boolean; run: () => void }[] } | null;
type ShareState = { plan: Project; note: string } | null;
type PreviewState = { plan: Project; pdf: PdfEntry | null; failed: string } | null;

const UNITS = sectionUnits();
const PEOPLE_HINTS: Record<string, { rolePlaceholder: string; defaultRole?: string }> = {
  K07: { rolePlaceholder: 'e.g. Construction Manager', defaultRole: 'Construction Manager' },
  K08: { rolePlaceholder: 'e.g. Site Engineer – Electrical', defaultRole: 'Site Engineer' },
  K09: { rolePlaceholder: 'e.g. First Aider' },
};

export function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [p, setP] = useState<Project | null>(null);
  const [group, setGroup] = useState('plans');
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [handle, setHandle] = useState<Handle | null>(null);
  const [fileName, setFileName] = useState('');
  const [dirtyFile, setDirtyFile] = useState(false);
  const [autosaved, setAutosaved] = useState('');
  const [busy, setBusy] = useState('');
  const [busyId, setBusyId] = useState('');
  const [toast, setToast] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [exportDir, setExportDir] = useState<any>(null);
  const [askedFolder, setAskedFolder] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [importErr, setImportErr] = useState('');
  const [master, setMaster] = useState<{ rows: MasterRow[]; name: string } | null>(null);
  const [share, setShare] = useState<ShareState>(null);
  const [preview, setPreview] = useState<PreviewState>(null);
  const lastSnap = useRef(0);
  const first = useRef(true);
  // a link (#library= or #hse=) is handled once the plan is loaded, by the latest render's handler
  const pendingHash = useRef('');
  const recv = useRef<(hash: string) => void>(() => {});
  // Open in HSE Plan Maker (Library): the cover photo chosen there is on the clipboard, waiting to be pasted
  const photoWait = useRef<string | null>(null);
  const takeCover = useRef<(b: Blob) => void>(() => {});

  const refreshPlans = async () => setPlans(await store.listPlans());

  // ---------------- load
  useEffect(() => {
    (async () => {
      await moveFromShared(); // once: plans kept by 1.0.5 and earlier move to HSE Plan Maker's own database
      const s = { ...defaultSettings(), ...((await store.loadSettings()) || {}) };
      setSettings(s);
      const id = await store.loadCurrentId();
      const saved = id ? await store.loadProject(id) : undefined;
      const cur = saved ? migrate(saved, s) : newProject(s);
      pendingHash.current = location.hash;
      setP(cur);
      const list = await store.listPlans();
      setPlans(list);
      setGroup(list.some((x) => x.name.trim()) ? 'plans' : 'project');
      store.persist();
      setExportDir(await loadExportDir());
      setAskedFolder(await wasAsked());
    })();
    const onHash = () => recv.current(location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (p && pendingHash.current) { const h = pendingHash.current; pendingHash.current = ''; recv.current(h); }
  }, [p]);
  // Ctrl+V while the Library's cover photo is waiting
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (photoWait.current == null) return;
      const item = [...(e.clipboardData?.items || [])].find((i) => i.kind === 'file' && i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      takeCover.current(file);
    };
    document.addEventListener('paste', onPaste, true);
    return () => document.removeEventListener('paste', onPaste, true);
  }, []);

  // ---------------- autosave
  useEffect(() => {
    if (!p) return;
    if (first.current) { first.current = false; return; }
    const t = setTimeout(async () => {
      await store.saveProject(p);
      if (Date.now() - lastSnap.current > 120000) { lastSnap.current = Date.now(); await store.snapshot(p); }
      setAutosaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      refreshPlans();
    }, 1000);
    return () => clearTimeout(t);
  }, [p]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const errors = useMemo(() => (p ? allErrors(p) : []), [p]);
  const missing = useMemo(() => (p ? missingMandatory(p) : []), [p]);

  if (!p) return <div class="boot">Loading…</div>;

  const fail = (title: string, e: any) => { console.error(e); setBusy(''); setBusyId(''); setDialog({ title, body: <p>{e?.message || String(e)}</p>, actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }] }); };
  const showError = (m: string) => setDialog({ title: 'Image not added', body: <p>{m}</p>, actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }] });

  /** A project from the Oxypro Project Library (#library=) or a plan shared by link (#hse=). */
  const receiveHash = async (hash: string, cur: Project, s: Settings) => {
    if (!hasLibraryHash(hash) && !hasShareHash(hash)) return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* keeps the address */ }
    try {
      if (hasLibraryHash(hash)) return incoming(await readLibraryLink(hash), cur, s);
      const shared = sanitize(await readShareHash(hash), s);
      setDialog({
        title: 'HSE Plan shared with you',
        body: <><p><b>{shared.P01 || 'An HSE Plan'}</b>{shared.D01 ? ` (${shared.D01}${shared.D03 ? `, Rev ${shared.D03}` : ''})` : ''} was shared with you by link.</p><p class="muted">Open it to preview it and download the PDF or Word file. It is added to My HSE Plans on this device as a copy.</p></>,
        actions: [
          { label: 'Not now', run: () => setDialog(null) },
          { label: 'Open the plan', primary: true, run: async () => { const n = { ...shared, id: uid(), modified: new Date().toISOString() }; await store.putProject(n); switchTo(n); setGroup('review'); setDialog(null); refreshPlans(); } },
        ],
      });
    } catch (e: any) { fail('Link not opened', e); }
  };
  recv.current = (h: string) => { if (p) receiveHash(h, p, settings); };

  // ---------------- updates with the linked-field rules
  const set = (id: string, v: any) => {
    setP((old) => {
      if (!old) return old;
      const n: any = { ...old, [id]: v, modified: new Date().toISOString() };
      const follow = (dKey: string, kKey: string) => {
        const was = (old as any)[kKey]?.name || '';
        if (!(old as any)[dKey] || (old as any)[dKey] === was) n[dKey] = n[kKey]?.name || '';
      };
      if (id === 'K04') follow('D06', 'K04');
      if (id === 'K02') follow('D08', 'K02');
      if (id === 'K01') follow('D10', 'K01');
      const lastRow = n.H01.length - 1;
      if (id === 'D03' && lastRow >= 0 && n.H01[lastRow].rev === old.D03) n.H01 = n.H01.map((r: any, i: number) => (i === lastRow ? { ...r, rev: v } : r));
      if (id === 'D04' && lastRow >= 0 && n.H01[lastRow].date === old.D04) n.H01 = n.H01.map((r: any, i: number) => (i === lastRow ? { ...r, date: v } : r));
      if (id === 'H01' && v.length && old.H01.length && old.D03 === old.H01[old.H01.length - 1].rev) n.D03 = v[v.length - 1].rev;
      // Abu Dhabi uses OSHAD-SF: the code column follows the emirate while its chapters are still the defaults
      if (id === 'P04') {
        const want = codeForEmirate(v), had = codeForEmirate(old.P04);
        const untouched = old.C01 === had && JSON.stringify(old.CHAP) === JSON.stringify(chaptersFor(had));
        if (want !== had && untouched) { n.C01 = want; n.C01name = codeHeading(want); n.CHAP = chaptersFor(want); setTimeout(() => setToast(`Code of practice changed to ${codeHeading(want)} (5. HSE Requirements)`), 0); }
      }
      return n;
    });
    setDirtyFile(true);
  };

  // ---------------- plan switching and file actions
  const switchTo = (n: Project, opts: { handle?: Handle | null; name?: string; dirty?: boolean } = {}) => {
    setP(n); setHandle(opts.handle ?? null); setFileName(opts.name ?? ''); setDirtyFile(!!opts.dirty);
    store.saveProject(n).then(refreshPlans);
  };
  const doNew = () => { switchTo(newProject(settings)); setGroup('project'); setToast('New plan started. It is kept under My HSE Plans as you type.'); };
  const doSample = () => { const n = testProject(settings); n.id = uid(); switchTo(n, { dirty: true }); setGroup('review'); setToast('Sample plan loaded (made-up test data)'); };
  const openPlan = async (id: string, view = 'project') => {
    if (id === p.id) { setGroup(view); return; }
    const x = await store.loadProject(id);
    if (!x) return refreshPlans();
    switchTo(migrate(x, settings));
    setGroup(view); window.scrollTo({ top: 0 });
  };
  const doOpen = async () => {
    try {
      const r = await pickFile([PLAN_EXT, '.json', '.pqp'], 'HSE Plan Maker plan');
      if (!r) return;
      const plan = parsePlanFile(r.text!, r.name);
      if (plan) {
        const n = sanitize(plan, settings);
        const exists = plans.find((x) => x.id === n.id);
        if (exists && n.id !== p.id && n.modified < exists.modified) n.id = uid(); // an older copy of a plan kept here: open it as its own plan
        switchTo(n, { handle: r.handle, name: r.name });
        setGroup('project');
        setToast(`Opened ${r.name}`);
        return;
      }
      // a PQP Maker or Library file: take the project details
      incoming(parseProjectText(r.text!, r.name), p, settings);
    } catch (e: any) { fail('Could not open the file', e); }
  };
  const doSave = async (saveAs: boolean, plan = p) => {
    try {
      const r = await saveProjectFile(plan, plan.id === p.id ? handle : null, saveAs, exportDir);
      if (!r) return;
      if (plan.id === p.id) { setHandle(r.handle); setFileName(r.name); setDirtyFile(false); }
      setToast(r.handle ? `Saved to ${r.name}` : `Downloaded ${r.name}`);
    } catch (e) { fail('Not saved', e); }
  };
  const duplicate = async (id: string) => {
    const x = id === p.id ? p : await store.loadProject(id);
    if (!x) return;
    const n = { ...migrate(x, settings), id: uid(), created: new Date().toISOString(), modified: new Date().toISOString(), P01: (x.P01 || 'Untitled project') + ' (copy)' };
    await store.putProject(n);
    await refreshPlans();
    setToast('Duplicated. The copy is at the top of the list.');
  };
  const remove = (id: string) => {
    const x = plans.find((y) => y.id === id);
    setDialog({
      title: 'Delete this plan?',
      body: <><p><b>{x?.name || 'Untitled project'}</b> is removed from this device. A saved .hsep file and exported Word / PDF files are not affected.</p></>,
      actions: [
        { label: 'Cancel', run: () => setDialog(null) },
        { label: 'Delete', primary: true, run: async () => {
          setDialog(null);
          await store.removeProject(id);
          if (id === p.id) { const n = newProject(settings); setP(n); setHandle(null); setFileName(''); setDirtyFile(false); await store.saveProject(n); }
          await refreshPlans();
          setToast('Plan deleted');
        } },
      ],
    });
  };
  const planById = async (id: string): Promise<Project | null> => (id === p.id ? p : ((x) => (x ? migrate(x, settings) : null))(await store.loadProject(id)));

  // ---------------- imports
  /** The cover photo chosen in the Library arrives by paste (Ctrl+V or Paste photo). */
  async function takeCoverPhoto(b: Blob) {
    try {
      const img = await coverFromBlob(b, photoWait.current || '');
      photoWait.current = null;
      setP((old) => (old ? { ...old, R10: img, modified: new Date().toISOString() } : old));
      setDirtyFile(true); setDialog(null);
      setToast('Cover photo added from the Project Library');
    } catch (e: any) { setToast(e?.message || 'The photo could not be added.'); }
  }
  takeCover.current = takeCoverPhoto;
  function askCoverPhoto(name: string, hadPhoto: boolean) {
    photoWait.current = name;
    const paste = async () => {
      try {
        const items = await (navigator.clipboard as any).read();
        for (const it of items) { const t = (it.types as string[]).find((x) => x.startsWith('image/')); if (t) return takeCoverPhoto(await it.getType(t)); }
        setToast('There is no photo on the clipboard. Choose the photo again in the Library, or add it under 2. Project Parties.');
      } catch { setToast('The browser did not allow reading the clipboard. Press Ctrl+V (⌘V on a Mac) instead.'); }
    };
    setDialog({
      title: 'Cover photo from the Project Library',
      body: <><p>The cover photo you chose in the Library is copied. Press <b>Ctrl+V</b> (⌘V on a Mac) to add it, or click <b>Paste photo</b>.</p>{hadPhoto && <p class="muted">It replaces the cover photo this plan has now.</p>}</>,
      actions: [
        { label: 'Skip', run: () => { photoWait.current = null; setDialog(null); } },
        { label: 'Paste photo', primary: true, run: paste },
      ],
    });
  }
  function incoming(inc: Incoming, cur: Project, s: Settings) {
    const f = inc.fields;
    const name = f.P01 || f.P02 || 'the project';
    const list = Object.keys(IMPORT_LABELS).filter((k) => k in f).map((k) => IMPORT_LABELS[k]).join(', ');
    const take = (n: Project, msg: string, fresh: boolean) => {
      if (fresh) switchTo(n, { dirty: true }); else { setP(n); setDirtyFile(true); }
      setImportOpen(false); setMaster(null); setDialog(null); setGroup('review'); window.scrollTo({ top: 0 });
      setToast(msg);
      if (inc.photo && !f.R10) askCoverPhoto(f.P01 || '', !!n.R10);
    };
    const create = () => take(migrate(applyImport({ ...newProject(s) }, f), s), `HSE Plan started from ${inc.source}: ${name}. Fill in the fields marked on the left.`, true);
    const update = () => take(migrate(applyImport(cur, f), s), `${name}: project details updated from ${inc.source}`, false);
    if (isBlankPlan(cur)) return update();
    const same = !!f.P02 && cur.P02.trim().toUpperCase() === f.P02;
    setDialog({
      title: `${name} from ${inc.source}`,
      body: <>
        <p>{same ? <>The plan open now has the same project code ({f.P02}). <b>Update</b> it to bring in these project details and keep everything else you entered.</> : <>The plan open now is <b>{cur.P01.trim() || 'Untitled project'}</b>. Start a <b>new plan</b> for {name}, or update the open plan's project details.</>}</p>
        <p class="muted">Brings in: {list}.</p>
      </>,
      actions: [
        { label: 'Cancel', run: () => setDialog(null) },
        { label: same ? 'Start a new plan' : 'Update the open plan', run: same ? create : update },
        { label: same ? 'Update this plan' : 'Start a new plan', primary: true, run: same ? update : create },
      ],
    });
  }
  const importFile = async () => {
    setImportErr('');
    try {
      const r = await pickFile(['.json', '.pqp', PLAN_EXT], 'Project Library, PQP Maker or HSE plan file');
      if (!r) return;
      incoming(parseProjectText(r.text!, r.name), p, settings);
    } catch (e: any) { setImportErr(e?.message || String(e)); }
  };
  const importMaster = async () => {
    setImportErr('');
    try {
      const r = await pickFile(['.xlsx', '.xlsm'], 'Oxypro - Projects Master List', true);
      if (!r) return;
      setBusy('Reading the Master List…');
      const rows = await readMasterList(r.bytes!);
      setBusy('');
      setMaster({ rows, name: r.name });
    } catch (e: any) { setBusy(''); setImportErr(e?.message || String(e)); }
  };
  const importLink = async (link: string) => {
    setImportErr('');
    try { incoming(await readLibraryLink(link), p, settings); } catch (e: any) { setImportErr(e?.message || String(e)); }
  };

  // ---------------- export, print, share (any plan)
  const prechecked = (plan: Project, verb: string, go: () => void) => {
    const errs = allErrors(plan), miss = missingMandatory(plan);
    const goFix = (f: FieldSpec) => { setDialog(null); if (plan.id !== p.id) openPlan(plan.id, f.group).then(() => goTo(f)); else goTo(f); };
    if (errs.length) {
      setDialog({
        title: `Fix ${errs.length} ${errs.length === 1 ? 'entry' : 'entries'} before ${verb}`,
        body: <ul class="issues">{errs.map((e) => <li><button class="linkbtn" onClick={() => goFix(e.f)}>{e.f.label}</button>: {e.msg}</li>)}</ul>,
        actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }],
      });
      return;
    }
    if (miss.length) {
      setDialog({
        title: `${miss.length} required ${miss.length === 1 ? 'field is' : 'fields are'} empty`,
        body: <><p>They will show as placeholders such as [PROJECT NAME] in the document.</p><ul class="issues">{miss.slice(0, 12).map((f) => <li><button class="linkbtn" onClick={() => goFix(f)}>{f.label}</button></li>)}{miss.length > 12 && <li>and {miss.length - 12} more</li>}</ul></>,
        actions: [{ label: 'Go back', run: () => setDialog(null) }, { label: 'Continue anyway', primary: true, run: () => { setDialog(null); go(); } }],
      });
    } else go();
  };

  const exportDoc = (kind: 'word' | 'pdf', plan: Project = p) => {
    const run = async (picked?: any) => {
      setDialog(null);
      let dir = picked !== undefined ? picked : exportDir;
      if (dir && !(await ensureWritable(dir))) dir = null;
      setBusy(kind === 'word' ? 'Building the Word file…' : 'Building the PDF…'); setBusyId(plan.id);
      try {
        const r = kind === 'word' ? await exportWord(plan, settings, dir) : await exportPdf(plan, settings, dir);
        setToast((r.folder ? `Saved to ${r.folder}: ${r.name}` : `Downloaded ${r.name}`) + (r.pages ? ` (${r.pages} pages)` : ''));
        if (r.note) setDialog({ title: 'Saved to Downloads instead', body: <p>{r.note} Close the file and export again to save it in {exportDir?.name || 'the export folder'}.</p>, actions: [{ label: 'OK', primary: true, run: () => setDialog(null) }] });
      } catch (e: any) { fail('Export failed', e); } finally { setBusy(''); setBusyId(''); }
    };
    const start = () => {
      if (!canPickFolder || exportDir || askedFolder) return run();
      setDialog({
        title: 'Where should exports be saved?',
        body: <><p>Choose a folder once, for example the <b>Samples</b> folder in your HSE Plan Maker folder, or the project's own folder. Every Word and PDF export is then saved straight into it, replacing an older export of the same name.</p><p>You can change it later under the export buttons.</p></>,
        actions: [
          { label: 'Use Downloads', run: () => { markAsked(); setAskedFolder(true); run(null); } },
          { label: 'Choose folder…', primary: true, run: async () => { const h = await pickFolder(); if (!h) return; markAsked(); setAskedFolder(true); run(h); } },
        ],
      });
    };
    prechecked(plan, 'exporting', start);
  };

  const doPrint = (plan: Project = p) => prechecked(plan, 'printing', async () => {
    setBusy('Preparing the print…');
    try {
      const pdf = await pdfFor(plan, settings);
      setBusy('');
      if (await printPdf(pdf.url)) return;
      setDialog({
        title: 'Print from the PDF',
        body: <p>The HSE Plan ({pdf.pages} pages) opens as a PDF in a new tab. Print it from there: {isIOS ? 'tap Share, then Print' : 'press Ctrl+P (Cmd+P on a Mac) or click the printer icon'}.</p>,
        actions: [
          { label: 'Cancel', run: () => setDialog(null) },
          { label: 'Open PDF', primary: true, run: () => { setDialog(null); if (!openPdfTab(pdf.url)) setToast('The browser blocked the new tab. Use PDF and print the file.'); } },
        ],
      });
    } catch (e) { fail('Print failed', e); }
  });

  const openShare = (plan: Project = p) => prechecked(plan, 'sharing', () => setShare({ plan, note: '' }));
  const shareNote = (note: string) => setShare((s) => (s ? { ...s, note } : s));
  const sharePdf = async (how: 'sheet' | 'eml' | 'mailto') => {
    if (!share) return;
    const plan = share.plan;
    try {
      setBusy('Building the PDF…');
      const pdf = await pdfFor(plan, settings);
      setBusy('');
      const name = outputBaseName(plan) + '.pdf';
      if (how === 'sheet') {
        const r = await shareFile(pdf.bytes, name, plan);
        if (r === 'shared') { setShare(null); setToast('Shared'); }
        return;
      }
      if (how === 'eml') {
        const eml = emlDraft(pdf.bytes, name, plan);
        const r = await deliver(new TextEncoder().encode(eml), outputBaseName(plan) + ' - Email.eml', 'message/rfc822', exportDir && (await ensureWritable(exportDir)) ? exportDir : null);
        shareNote(`${r.folder ? `Saved to ${r.folder}` : 'Downloaded'}: ${r.name}. Open it: Outlook (or Mail) shows a new email with the PDF attached, ready to address and send.`);
        return;
      }
      const r = await deliver(pdf.bytes, name, 'application/pdf', exportDir && (await ensureWritable(exportDir)) ? exportDir : null);
      location.href = `mailto:?subject=${encodeURIComponent(mailSubject(plan))}&body=${encodeURIComponent(mailBody(plan))}`;
      shareNote(`${r.folder ? `Saved to ${r.folder}` : 'Downloaded'}: ${r.name}. Attach it to the new email.`);
    } catch (e: any) { setBusy(''); shareNote(e?.message || String(e)); }
  };
  const shareByLink = async (email: boolean) => {
    if (!share) return;
    try {
      const link = await shareLink(share.plan);
      if (email) { location.href = `mailto:?subject=${encodeURIComponent(mailSubject(share.plan))}&body=${encodeURIComponent(mailBody(share.plan, link))}`; return; }
      await navigator.clipboard.writeText(link);
      shareNote(`Link copied (${Math.round(link.length / 100) / 10} k characters). Paste it into an email or chat.`);
    } catch (e: any) { shareNote(e?.message || 'The link could not be copied.'); }
  };

  // ---------------- preview of any plan (My HSE Plans)
  const openPreview = async (id: string) => {
    const plan = await planById(id);
    if (!plan) return;
    setPreview({ plan, pdf: null, failed: '' });
    try { const pdf = await pdfFor(plan, settings); setPreview((v) => (v && v.plan.id === id ? { ...v, pdf } : v)); }
    catch (e: any) { setPreview((v) => (v ? { ...v, failed: e?.message || String(e) } : v)); }
  };
  const withPlan = (fn: (plan: Project) => void) => async (id: string) => { const plan = await planById(id); if (plan) fn(plan); };

  const pickFolder = async (): Promise<any> => {
    try {
      const h = await chooseExportDir(exportDir);
      if (h) { setExportDir(h); setToast(`Exports will be saved to ${h.name}`); }
      return h;
    } catch (e) { fail('Folder not set', e); return null; }
  };
  const useDownloads = async () => { await forgetExportDir(); setExportDir(null); setToast('Exports will go to the Downloads folder'); };

  const goTo = (f: FieldSpec) => {
    setGroup(f.group);
    setTimeout(() => {
      const el = document.getElementById('row-' + f.id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el?.querySelector('input,select,textarea,button') as HTMLElement | null)?.focus();
    }, 60);
  };

  // ---------------- field renderer
  const render = (f: FieldSpec) => {
    const v: any = (p as any)[f.id];
    const err = fieldError(f, p);
    const id = 'f-' + f.id;
    let ctl: ComponentChildren = null;
    let wide = false;
    switch (f.type) {
      case 'text': ctl = <TextInput id={id} value={v || ''} upper={!!f.code} placeholder={f.code ? 'e.g. DXB-243' : f.placeholder} onInput={(x) => set(f.id, x)} />; break;
      case 'number': ctl = <TextInput id={id} value={v || ''} numeric onInput={(x) => set(f.id, x.trim())} />; break;
      case 'longtext': ctl = <TextArea id={id} value={v || ''} max={f.max} onInput={(x) => set(f.id, x)} rows={4} />; wide = true; break;
      case 'dmy': ctl = <DmyInput id={id} value={v || ''} onInput={(x) => set(f.id, x)} />; break;
      case 'docbox': ctl = <DocBox docNo={p.D01} rev={p.D03} date={p.D04} onChange={(k, x) => set(k, x)} hint={`e.g. OPEM-${projectCode(p) || 'DXB-243'}-HS-PLN-001`} />; wide = true; break;
      case 'dropdown': ctl = <Select id={id} value={v || ''} options={f.options!} onChange={(x) => set(f.id, x)} />; break;
      case 'multi': ctl = <Multi id={id} value={v || []} options={f.options!} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'toggle': ctl = <Toggle id={id} value={!!v} onChange={(x) => set(f.id, x)} label={v ? 'Shown on every page' : 'Hidden'} />; break;
      case 'image': ctl = <ImagePick id={id} value={v} maxMB={f.maxMB || 2} onChange={(x) => set(f.id, x)} onError={showError}
        fallback={f.id === 'R09' ? ASSET_URLS.logo : f.id === 'R12' ? ASSET_URLS.watermark : f.id === 'I01' ? ASSET_URLS.iso45001 : undefined}
        fallbackLabel={f.id === 'R09' ? 'Default: Oxypro logo' : f.id === 'R12' ? 'Default: faint Oxypro mark' : f.id === 'I01' ? 'Built-in: ISO 45001:2018, TUV Apex, CN031157 (26.02.2026)' : undefined} />; wide = true; break;
      case 'images': ctl = <Images id={id} value={v || []} maxMB={f.maxMB || 5} onChange={(x) => set(f.id, x)} onError={showError} />; wide = true; break;
      case 'person': ctl = <PersonInput id={id} value={v} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'persons': ctl = <Persons id={id} value={v || []} min={0} max={f.personMax || 10} addLabel="Add person" onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'people': ctl = <People id={id} value={v || []} onChange={(x) => set(f.id, x)} {...PEOPLE_HINTS[f.id]} />; wide = true; break;
      case 'revisions': ctl = <Revisions id={id} value={v} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'lines': ctl = <Lines id={id} value={v || []} reset={f.reset} extra={f.extra} numbered={f.numbered} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'permits': ctl = <Permits id={id} value={v || []} co={settings.companyShort || 'Oxypro'} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'contacts': ctl = <Contacts id={id} value={v || []} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'policies': ctl = <Policies id={id} value={v || []} onChange={(x) => set(f.id, x)} onError={showError} />; wide = true; break;
      case 'code': ctl = <CodeEditor code={p.C01} name={p.C01name} chap={p.CHAP} onChange={(c, n, ch) => setP((o) => (o ? { ...o, C01: c, C01name: n, CHAP: ch, modified: new Date().toISOString() } : o))} />; wide = true; break;
      case 'regmode': ctl = <RegModePick id={id} value={v} name={f.id === 'A02mode' ? 'Project Risk Register' : 'Environmental Impact Register'} scans={(f.id === 'A02mode' ? p.A02 : p.A03).length} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'risks': ctl = <RiskRows id={id} value={v || []} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'envs': ctl = <EnvRows id={id} value={v || []} onChange={(x) => set(f.id, x)} />; wide = true; break;
      case 'sections': return <SectionsPanel p={p} onChange={(x) => set('OFF', x)} />;
    }
    return <Row f={f} error={err} wide={wide}>{ctl}</Row>;
  };

  const groupFields = FIELDS.filter((f) => f.group === group && (!f.showIf || f.showIf(p)));
  const groupIssues = (g: string) => FIELDS.filter((f) => f.group === g && (fieldError(f, p) || (f.mandatory && missing.includes(f)))).length;
  const isReview = group === 'review', isPlans = group === 'plans';
  const title = isReview ? 'Review' : isPlans ? 'My HSE Plans' : GROUPS.find((g) => g.id === group)!.title;
  const nums = numbering(new Set(p.OFF));
  const leftOut = UNITS.filter((u) => !(u.id in nums) && !(u.parent && !(u.parent in nums))).map((u) => u.title);
  const openReview = () => { setGroup('review'); window.scrollTo({ top: 0 }); };
  const boxes = emptyBoxes(p);

  return (
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <img src={iconUrl} alt="" width={34} height={34} />
          <div>
            <div class="appname">{APP_NAME}</div>
            <div class="filestate">
              <span>{p.P01.trim() || 'Untitled project'}{fileName ? ` · ${fileName}` : ''}{dirtyFile && fileName ? ' (changed)' : ''}</span>
              {autosaved && <span class="autosave">Autosaved {autosaved}</span>}
            </div>
          </div>
        </div>
        <nav class="actions" aria-label="File">
          <button class="btn bar" onClick={() => setGroup('plans')}>My Plans</button>
          <button class="btn bar" onClick={doNew}>New</button>
          <button class="btn bar" onClick={doOpen}>Open</button>
          <button class="btn bar" onClick={() => doSave(false)}>Save</button>
          <button class="btn bar" onClick={() => doSave(true)}>Save as</button>
          <button class="btn bar" onClick={() => { setImportErr(''); setImportOpen(true); }}>Import project</button>
          <span class="sep" />
          <button class="btn bar" onClick={openReview}>Review</button>
          <button class="btn bar" onClick={() => doPrint()}>Print</button>
          <button class="btn bar" onClick={() => openShare()}>Share</button>
          <span class="sep" />
          <button class="btn bar primary" onClick={() => exportDoc('word')}>Word</button>
          <button class="btn bar primary" onClick={() => exportDoc('pdf')}>PDF</button>
        </nav>
      </header>
      <div class="tagband" aria-hidden="true">THE COMPLETE SOLUTION FOR BUILDING SERVICES</div>

      <div class={'body' + (isPlans ? ' wide' : '')}>
        <aside class="nav" aria-label="Input groups">
          <button class={'navitem navplans' + (isPlans ? ' active' : '')} onClick={() => setGroup('plans')} aria-current={isPlans ? 'page' : undefined}>
            <span>My HSE Plans</span><span class="navcount">{plans.length}</span>
          </button>
          <div class="navlabel">{p.P01.trim() || 'Untitled project'}</div>
          {GROUPS.map((g) => {
            const n = g.id === 'sections' ? 0 : groupIssues(g.id);
            return (
              <button class={'navitem' + (g.id === group ? ' active' : '')} onClick={() => setGroup(g.id)} aria-current={g.id === group ? 'page' : undefined}>
                <span>{g.title}</span>
                {n > 0 && <span class="badge" title={`${n} to complete or fix`}>{n}</span>}
              </button>
            );
          })}
          <button class={'navitem navreview' + (isReview ? ' active' : '')} onClick={() => setGroup('review')} aria-current={isReview ? 'page' : undefined}>
            <span>Review</span><span class="navhint">before export</span>
          </button>
          <button class={'navitem navabout' + (aboutOpen ? ' active' : '')} onClick={() => setAboutOpen(true)} aria-haspopup="dialog" aria-expanded={aboutOpen}>
            <span>About this app</span>
          </button>
        </aside>

        <main class="sheet" aria-labelledby="sheet-title">
          <h1 id="sheet-title">{title}</h1>
          {isPlans ? (
            <Plans plans={plans} currentId={p.id} busyId={busyId} onOpen={(id) => openPlan(id)} onNew={doNew} onSample={doSample} onImport={() => { setImportErr(''); setImportOpen(true); }} onOpenFile={doOpen}
              onPreview={openPreview} onWord={withPlan((x) => exportDoc('word', x))} onPdf={withPlan((x) => exportDoc('pdf', x))} onShare={withPlan((x) => openShare(x))} onDuplicate={duplicate} onDelete={remove} />
          ) : isReview ? (
            <Review p={p} s={settings} errors={errors} missing={missing} leftOut={leftOut} fileName={fileName} dirtyFile={dirtyFile}
              onGo={setGroup} goTo={goTo} onExport={(k) => exportDoc(k)} onPrint={() => doPrint()} onShare={() => openShare()} onSave={() => doSave(false)} />
          ) : <>
            {group === 'doc' && <p class="lead">Type the Document No., Revision and Date to finalise the cover. Each plan is a revision of the company sample HSE Plan (Rev 00, 26.06.2024), so it starts as Rev 01; the amendment record's last row follows the Revision and Date.</p>}
            {group === 'branding' && <p class="lead">The Oxypro header and watermark, as on the PQP. Change them here for this plan only.</p>}
            {group === 'appendix' && <p class="lead">Appendix 1 (HSE organization chart) is drawn from 4. HSE Organization. Appendix 2 is the ISO 45001:2018 certificate. Appendices 3 and 4, the Project Risk Register and the Environmental Impact Register, start with the two standard sentences and then print the register, scans of it, or nothing more.</p>}
            {group === 'reqs' && <p class="lead">The standard lists of the Oxypro HSE Plan. Change them for this project; Reset brings back the standard list.</p>}
            {group === 'people' && <OrgPreview p={p} />}
            <div class="fields">{groupFields.map((f) => <>{f.section && <h2 class="subhead">{f.section}</h2>}{render(f)}</>)}</div>
          </>}
        </main>

        {!isPlans && (
          <aside class="titleblock" aria-label="Document summary">
            <div class="tb">
              <div class="tb-cell tb-wide"><span class="k">Project</span><span class="v">{p.P01 || '—'}</span></div>
              <div class="tb-cell tb-wide tb-ref"><span class="k">Document No.</span><span class="v ref">{p.D01.trim() || <button class="linkbtn" onClick={() => setGroup('doc')}>Type it</button>}</span></div>
              <div class="tb-cell"><span class="k">Rev</span><span class="v">{p.D03.trim() || '—'}</span></div>
              <div class="tb-cell"><span class="k">Date</span><span class="v">{p.D04.trim() || '—'}</span></div>
              <div class="tb-cell tb-wide tb-status"><span class="k">Status</span><span class="stamp">{p.D05 || 'Draft'}</span></div>
            </div>
            <div class="check">
              {errors.length === 0 && missing.length === 0 ? <p class="ok">All required fields are complete.</p> : (
                <>
                  {errors.length > 0 && <p class="bad">{errors.length} {errors.length === 1 ? 'entry needs' : 'entries need'} fixing before export.</p>}
                  {missing.length > 0 && <p class="warn">{missing.length} required {missing.length === 1 ? 'field is' : 'fields are'} empty.</p>}
                  <button class="linkbtn" onClick={() => goTo(errors[0]?.f || missing[0])}>Go to the first one</button>
                </>
              )}
              {boxes.length > 0 && <p class="muted small">Cover boxes left blank: {boxes.join(', ')}</p>}
              {!isReview && <button class="linkbtn rv-link" onClick={openReview}>Review the plan before exporting</button>}
            </div>
            <div class="exports">
              <button class="btn primary block" onClick={() => exportDoc('word')}>Word (.docx)</button>
              <button class="btn primary block" onClick={() => exportDoc('pdf')}>PDF</button>
              <div class="btnpair">
                <button class="btn block" onClick={() => doPrint()}>Print</button>
                <button class="btn block" onClick={() => openShare()}>Share</button>
              </div>
              {canPickFolder ? (
                <div class="expdir">
                  <span class="k">Exports are saved to</span>
                  <span class="v" title={exportDir ? 'Folder chosen in this browser' : 'Browser Downloads folder'}>{exportDir ? exportDir.name : 'Downloads'}</span>
                  <span class="acts">
                    <button class="linkbtn" onClick={pickFolder}>{exportDir ? 'Change folder' : 'Choose folder'}</button>
                    {exportDir && <button class="linkbtn" onClick={useDownloads}>Use Downloads</button>}
                  </span>
                </div>
              ) : <p class="expdir-note">Exports go to your Downloads folder.</p>}
            </div>
          </aside>
        )}
      </div>

      <footer class="credit">
        <span>{CREDIT}</span>
        <span class="ver">{VERSION_LINE}</span>
        <button class="linkbtn about-link" onClick={() => setAboutOpen(true)} aria-haspopup="dialog">About this app</button>
      </footer>

      {aboutOpen && <AboutPanel onClose={() => setAboutOpen(false)} exportFolder={exportDir?.name || null} canPickFolder={canPickFolder} onGo={(g) => { setGroup(g); window.scrollTo({ top: 0 }); }} />}
      {importOpen && <ImportDialog onClose={() => { setImportOpen(false); setMaster(null); }} onFile={importFile} onMaster={importMaster} onLink={importLink}
        master={master?.rows || null} masterName={master?.name || ''} error={importErr} onPickMaster={(r) => incoming({ fields: r.fields, source: 'the Projects Master List', label: r.fields.P01 || '' }, p, settings)} />}
      {share && <ShareDialog name={share.plan.P01.trim() || 'this HSE Plan'} fileName={outputBaseName(share.plan) + '.pdf'} canShareFile={canShareFile()} note={share.note} onClose={() => setShare(null)}
        onShareSheet={() => sharePdf('sheet')} onEml={() => sharePdf('eml')} onMailto={() => sharePdf('mailto')} onCopyLink={() => shareByLink(false)} onEmailLink={() => shareByLink(true)} />}
      {preview && <PreviewModal plan={preview.plan} pdf={preview.pdf} failed={preview.failed} onClose={() => setPreview(null)}
        onWord={() => exportDoc('word', preview.plan)} onPdf={() => exportDoc('pdf', preview.plan)} onPrint={() => doPrint(preview.plan)} onShare={() => openShare(preview.plan)} onOpen={() => { const id = preview.plan.id; setPreview(null); openPlan(id); }} />}

      {busy && <div class="overlay top" role="status"><div class="busy">{busy}</div></div>}
      {toast && <div class="toast" role="status">{toast}</div>}
      {dialog && (
        <div class="overlay top" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <div class="dialog">
            <h2 id="dlg-title">{dialog.title}</h2>
            <div class="dbody">{dialog.body}</div>
            <div class="dactions">{dialog.actions.map((a) => <button class={'btn' + (a.primary ? ' primary' : '')} onClick={a.run}>{a.label}</button>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionsPanel(props: { p: Project; onChange: (off: string[]) => void }) {
  const off = new Set(props.p.OFF);
  const nums = numbering(off);
  const toggle = (id: string) => {
    const n = new Set(off);
    if (n.has(id)) n.delete(id); else n.add(id);
    props.onChange([...n]);
  };
  const rows = UNITS.map((u) => ({ ...u, on: u.id in nums, parentOff: !!u.parent && off.has(u.parent) }));
  return (
    <div class="sections wide" id="row-OFF">
      <p class="lead">Untick a section to leave it out. The sections after it are renumbered. {rows.filter((r) => r.on).length} of {rows.length} included.</p>
      <div class="btnrow"><button class="btn small" onClick={() => props.onChange([])}>Include all</button></div>
      <ul class="tree">
        {rows.map((r) => (
          <li class={'lv' + r.level + (r.parentOff ? ' muted' : '')}>
            <label>
              <input type="checkbox" checked={!off.has(r.id)} disabled={r.parentOff} onChange={() => toggle(r.id)} />
              <span class="num">{r.on ? (r.id === 'app' ? '' : nums[r.id].replace(/^Appendix /, 'App. ')) : ''}</span>
              <span class="t">{r.title}</span>
              {r.added ? <span class="added">added</span> : null}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
