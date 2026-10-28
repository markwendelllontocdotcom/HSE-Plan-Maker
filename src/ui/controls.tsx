import { useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { FieldSpec } from '../model/fields';
import type { ImageData, Person, ExtraPerson, RevRow, PermitRow, ContactRow, PolicyRow, CodeKey } from '../model/types';
import { readImageFile, POLICY_URLS } from '../platform-browser';
import { todayDMY, parseDMY } from '../model/format';
import { defaultPermits, defaultContacts, defaultPolicies, CODE_OPTIONS, chaptersFor, codeHeading, uid } from '../model/defaults';
import { SECTIONS } from '../content/hse';

export function Row(props: { f: FieldSpec; error?: string | null; children: ComponentChildren; wide?: boolean }) {
  const { f, error } = props;
  const id = 'f-' + f.id;
  return (
    <div class={'field' + (props.wide ? ' wide' : '') + (error ? ' has-error' : '')} id={'row-' + f.id}>
      <label class="label" for={id}>
        {f.label}
        {f.mandatory && <span class="req" title="Required">*</span>}
        <span class="fid">{f.id}</span>
      </label>
      <div class="control">{props.children}</div>
      {error && <div class="err" role="alert">{error}</div>}
      {(f.help || f.usedIn) && (
        <div class="help">
          {f.help}
          {f.help && f.usedIn ? ' ' : ''}
          {f.usedIn && <span class="used">Used in: {f.usedIn}</span>}
        </div>
      )}
    </div>
  );
}

export function TextInput(props: { id: string; value: string; onInput: (v: string) => void; numeric?: boolean; upper?: boolean; placeholder?: string; type?: string }) {
  const onInput = (e: Event) => {
    const el = e.target as HTMLInputElement;
    if (props.upper) {
      // capitals as you type, keeping the cursor where it was
      const up = el.value.toUpperCase();
      if (up !== el.value && up.length === el.value.length) {
        const a = el.selectionStart, b = el.selectionEnd;
        el.value = up;
        if (a != null && b != null) el.setSelectionRange(a, b);
      }
    }
    props.onInput(el.value);
  };
  return (
    <input id={props.id} type={props.type || 'text'} value={props.value} placeholder={props.placeholder}
      inputMode={props.numeric ? 'numeric' : undefined} autoComplete="off" spellcheck={props.upper ? false : undefined}
      autoCapitalize={props.upper ? 'characters' : undefined} onInput={onInput} />
  );
}

export function TextArea(props: { id: string; value: string; onInput: (v: string) => void; max?: number; rows?: number }) {
  return (
    <div class="ta">
      <textarea id={props.id} rows={props.rows || 4} value={props.value} onInput={(e) => props.onInput((e.target as HTMLTextAreaElement).value)} />
      {props.max && <div class={'count' + (props.value.length > props.max ? ' over' : '')}>{props.value.length} / {props.max}</div>}
    </div>
  );
}

export function Select(props: { id: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select id={props.id} value={props.value} onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}>
      <option value="">Select…</option>
      {props.options.map((o) => <option value={o}>{o}</option>)}
    </select>
  );
}

export function Multi(props: { id: string; value: string[]; options: string[]; onChange: (v: string[]) => void; other?: string; onOther?: (v: string) => void }) {
  const toggle = (o: string) => props.onChange(props.value.includes(o) ? props.value.filter((x) => x !== o) : [...props.value, o]);
  return (
    <div>
      <div class="chips" role="group" id={props.id}>
        {props.options.map((o) => (
          <label class={'chip' + (props.value.includes(o) ? ' on' : '')}>
            <input type="checkbox" checked={props.value.includes(o)} onChange={() => toggle(o)} />
            {o}
          </label>
        ))}
      </div>
      {props.onOther && props.value.includes('Other') && (
        <input class="other" type="text" placeholder="Other – specify (separate with commas)" value={props.other || ''} onInput={(e) => props.onOther!((e.target as HTMLInputElement).value)} />
      )}
    </div>
  );
}

export function Toggle(props: { id: string; value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label class="toggle">
      <input id={props.id} type="checkbox" checked={props.value} onChange={(e) => props.onChange((e.target as HTMLInputElement).checked)} />
      <span>{props.label}</span>
    </label>
  );
}

export function ImagePick(props: { id: string; value: ImageData | null; maxMB: number; onChange: (v: ImageData | null) => void; onError: (m: string) => void; fallback?: string; fallbackLabel?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: Event) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = '';
    if (!f) return;
    setBusy(true);
    try { props.onChange(await readImageFile(f, props.maxMB)); } catch (err: any) { props.onError(err.message || String(err)); } finally { setBusy(false); }
  };
  const src = props.value?.dataUrl || props.fallback;
  return (
    <div class="imgpick">
      <div class={'thumb' + (src ? '' : ' empty')}>{src ? <img src={src} alt="" /> : <span>No image</span>}</div>
      <div class="imgside">
        <div class="imgname">{props.value ? props.value.name : props.fallbackLabel || 'None'}</div>
        <div class="btnrow">
          <button type="button" class="btn small" onClick={() => ref.current?.click()} disabled={busy}>{busy ? 'Reading…' : props.value ? 'Replace image' : 'Choose image'}</button>
          {props.value && <button type="button" class="btn small ghost" onClick={() => props.onChange(null)}>{props.fallback ? 'Use default' : 'Remove'}</button>}
        </div>
      </div>
      <input ref={ref} id={props.id} type="file" accept="image/png,image/jpeg,image/*" hidden onChange={pick} />
    </div>
  );
}

export function Images(props: { id: string; value: ImageData[]; maxMB: number; onChange: (v: ImageData[]) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (e: Event) => {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    (e.target as HTMLInputElement).value = '';
    const add: ImageData[] = [];
    for (const f of files) {
      try { add.push(await readImageFile(f, props.maxMB)); } catch (err: any) { props.onError(err.message || String(err)); }
    }
    if (add.length) props.onChange([...props.value, ...add]);
  };
  return (
    <div>
      <div class="gallery">
        {props.value.map((im, i) => (
          <figure>
            <img src={im.dataUrl} alt="" />
            <figcaption>{im.name}</figcaption>
            <button type="button" class="btn small ghost" onClick={() => props.onChange(props.value.filter((_, j) => j !== i))}>Remove</button>
          </figure>
        ))}
      </div>
      <button type="button" class="btn small" onClick={() => ref.current?.click()}>Add images</button>
      <input ref={ref} id={props.id} type="file" accept="image/png,image/jpeg,image/*" multiple hidden onChange={pick} />
    </div>
  );
}

export function PersonInput(props: { id: string; value: Person; onChange: (v: Person) => void }) {
  const v = props.value;
  return (
    <div class="grid3">
      <input id={props.id} type="text" placeholder="Name" value={v.name} onInput={(e) => props.onChange({ ...v, name: (e.target as HTMLInputElement).value })} />
      <input type="email" placeholder="Email (optional)" value={v.email} onInput={(e) => props.onChange({ ...v, email: (e.target as HTMLInputElement).value })} />
      <input type="tel" placeholder="Phone (optional)" value={v.phone} onInput={(e) => props.onChange({ ...v, phone: (e.target as HTMLInputElement).value })} />
    </div>
  );
}

export function RowsTable<T>(props: { id: string; head: string[]; rows: T[]; render: (r: T, set: (r: T) => void, i: number) => ComponentChildren[]; onChange: (v: T[]) => void; blank: () => T; addLabel: string; extra?: ComponentChildren; minRows?: number; maxRows?: number }) {
  const set = (i: number) => (r: T) => props.onChange(props.rows.map((x, j) => (j === i ? r : x)));
  return (
    <div class="rows" id={props.id}>
      <div class="rtable" role="table">
        <div class="rhead" role="row">{props.head.map((h) => <div role="columnheader">{h}</div>)}<div /></div>
        {props.rows.map((r, i) => (
          <div class="rrow" role="row">
            {props.render(r, set(i), i).map((c) => <div role="cell">{c}</div>)}
            <div role="cell">
              <button type="button" class="btn small ghost" disabled={props.rows.length <= (props.minRows || 0)} onClick={() => props.onChange(props.rows.filter((_, j) => j !== i))} aria-label="Remove row">Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div class="btnrow">
        <button type="button" class="btn small" disabled={props.maxRows != null && props.rows.length >= props.maxRows} onClick={() => props.onChange([...props.rows, props.blank()])}>{props.addLabel}</button>
        {props.extra}
      </div>
    </div>
  );
}

const inp = (val: string, on: (v: string) => void, ph = '', type = 'text') => (
  <input type={type} value={val} placeholder={ph} onInput={(e) => on((e.target as HTMLInputElement).value)} />
);

export function People(props: { id: string; value: ExtraPerson[]; onChange: (v: ExtraPerson[]) => void; rolePlaceholder?: string; defaultRole?: string }) {
  return (
    <RowsTable id={props.id} head={['Role', 'Name', 'Email', 'Phone']} rows={props.value} onChange={props.onChange} addLabel="Add person"
      blank={() => ({ role: props.defaultRole || '', name: '', email: '', phone: '' })}
      render={(r, set) => [inp(r.role, (v) => set({ ...r, role: v }), props.rolePlaceholder || 'e.g. Site Engineer'), inp(r.name, (v) => set({ ...r, name: v })), inp(r.email, (v) => set({ ...r, email: v }), '', 'email'), inp(r.phone, (v) => set({ ...r, phone: v }), '', 'tel')]} />
  );
}

/** Same role on every row (QA/QC Engineers): one chart box per row. */
export function Persons(props: { id: string; value: Person[]; onChange: (v: Person[]) => void; min: number; max: number; addLabel: string }) {
  return (
    <RowsTable id={props.id} head={['#', 'Name', 'Email', 'Phone']} rows={props.value} onChange={props.onChange} addLabel={props.addLabel} minRows={props.min} maxRows={props.max}
      blank={() => ({ name: '', email: '', phone: '' })}
      render={(r, set, i) => [<span class="rownum">{i + 1}</span>, inp(r.name, (v) => set({ ...r, name: v }), 'Name'), inp(r.email, (v) => set({ ...r, email: v }), 'Email (optional)', 'email'), inp(r.phone, (v) => set({ ...r, phone: v }), 'Phone (optional)', 'tel')]} />
  );
}


/** A date typed as DD.MM.YYYY (the Oxypro document format), with a Today button. */
export function DmyInput(props: { id: string; value: string; onInput: (v: string) => void; placeholder?: string }) {
  const tidy = () => { const t = parseDMY(props.value); if (t && t !== props.value) props.onInput(t); };
  return (
    <div class="dmy">
      <input id={props.id} type="text" inputMode="numeric" value={props.value} placeholder={props.placeholder || 'DD.MM.YYYY'} autoComplete="off" onInput={(e) => props.onInput((e.target as HTMLInputElement).value)} onBlur={tidy} />
      <button type="button" class="btn small ghost" onClick={() => props.onInput(todayDMY())} title="Fill in today's date">Today</button>
    </div>
  );
}

/** The three cover boxes, typed by hand. */
export function DocBox(props: { docNo: string; rev: string; date: string; onChange: (k: 'D01' | 'D03' | 'D04', v: string) => void; hint: string }) {
  return (
    <div class="docbox" id="f-DOCBOX">
      <label><span>Document No.</span><input type="text" value={props.docNo} placeholder={props.hint} autoComplete="off" spellcheck={false} onInput={(e) => props.onChange('D01', (e.target as HTMLInputElement).value)} /></label>
      <label class="narrow"><span>Revision</span><input type="text" value={props.rev} placeholder="00" autoComplete="off" onInput={(e) => props.onChange('D03', (e.target as HTMLInputElement).value)} /></label>
      <label><span>Date</span><DmyInput id="f-D04" value={props.date} onInput={(v) => props.onChange('D04', v)} /></label>
    </div>
  );
}

export function Revisions(props: { id: string; value: RevRow[]; onChange: (v: RevRow[]) => void }) {
  return (
    <RowsTable id={props.id} head={['Rev', 'Date (DD.MM.YYYY)', 'Particulars of Revision']} rows={props.value} onChange={props.onChange} addLabel="Add revision row" minRows={1}
      blank={() => ({ rev: String(props.value.length).padStart(2, '0'), date: todayDMY(), desc: '' })}
      render={(r, set) => [inp(r.rev, (v) => set({ ...r, rev: v }), '00'), inp(r.date, (v) => set({ ...r, date: v }), 'DD.MM.YYYY'), inp(r.desc, (v) => set({ ...r, desc: v }), 'e.g. Initial Issue')]} />
  );
}

/** An editable list of lines (procedures, standards, objectives …) with move, remove, add and reset. */
export function Lines(props: { id: string; value: string[]; onChange: (v: string[]) => void; reset?: string[]; extra?: string[]; numbered?: boolean }) {
  const v = props.value;
  const set = (i: number, t: string) => props.onChange(v.map((x, j) => (j === i ? t : x)));
  const move = (i: number, d: number) => { const n = [...v]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); props.onChange(n); };
  const missingExtra = (props.extra || []).filter((e) => !v.includes(e));
  const changed = props.reset && (props.reset.length !== v.length || props.reset.some((x, i) => x !== v[i]));
  return (
    <div class="lines" id={props.id}>
      <ol class={props.numbered ? 'numbered' : 'bulleted'}>
        {v.map((line, i) => (
          <li>
            <input type="text" value={line} onInput={(e) => set(i, (e.target as HTMLInputElement).value)} aria-label={`Line ${i + 1}`} />
            <span class="lineacts">
              <button type="button" class="btn small ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" title="Move up">▲</button>
              <button type="button" class="btn small ghost" disabled={i === v.length - 1} onClick={() => move(i, 1)} aria-label="Move down" title="Move down">▼</button>
              <button type="button" class="btn small ghost" onClick={() => props.onChange(v.filter((_, j) => j !== i))} aria-label="Remove" title="Remove">✕</button>
            </span>
          </li>
        ))}
      </ol>
      <div class="btnrow">
        <button type="button" class="btn small" onClick={() => props.onChange([...v, ''])}>Add line</button>
        {missingExtra.map((e) => <button type="button" class="btn small" onClick={() => props.onChange([...v, e])} title={e}>Add: {e.length > 48 ? e.slice(0, 46) + '…' : e}</button>)}
        {props.reset && <button type="button" class="btn small ghost" disabled={!changed} onClick={() => props.onChange([...props.reset!])}>Reset to the standard list</button>}
      </div>
    </div>
  );
}

export function Permits(props: { id: string; value: PermitRow[]; onChange: (v: PermitRow[]) => void; co: string }) {
  return (
    <RowsTable id={props.id} head={['Work Activity', 'Permit in Force', 'Permit Issued By']} rows={props.value} onChange={props.onChange} addLabel="Add permit"
      blank={() => ({ activity: '', inForce: 'Y', issuedBy: 'Main Contractor' })}
      extra={<button type="button" class="btn small ghost" onClick={() => props.onChange(defaultPermits(props.co))}>Reset to the standard list</button>}
      render={(r, set) => [
        inp(r.activity, (v) => set({ ...r, activity: v }), 'e.g. Hot Works'),
        <select value={r.inForce} onChange={(e) => set({ ...r, inForce: (e.target as HTMLSelectElement).value })}><option value="Y">Y (Yes)</option><option value="N">N (No)</option></select>,
        inp(r.issuedBy, (v) => set({ ...r, issuedBy: v }), 'Main Contractor'),
      ]} />
  );
}

export function Contacts(props: { id: string; value: ContactRow[]; onChange: (v: ContactRow[]) => void }) {
  return (
    <RowsTable id={props.id} head={['Service / Contact', 'Number']} rows={props.value} onChange={props.onChange} addLabel="Add contact"
      blank={() => ({ service: '', number: '' })}
      extra={<button type="button" class="btn small ghost" onClick={() => props.onChange(defaultContacts())}>Reset</button>}
      render={(r, set) => [inp(r.service, (v) => set({ ...r, service: v }), 'e.g. Nearest Hospital'), inp(r.number, (v) => set({ ...r, number: v }), '', 'tel')]} />
  );
}

/** Section 6 policy statements: tick, title, reference and the scan (built in, or a newer one). */
export function Policies(props: { id: string; value: PolicyRow[]; onChange: (v: PolicyRow[]) => void; onError: (m: string) => void }) {
  const set = (i: number, r: PolicyRow) => props.onChange(props.value.map((x, j) => (j === i ? r : x)));
  return (
    <div class="policies" id={props.id}>
      {props.value.map((r, i) => {
        const builtIn = POLICY_URLS[r.key];
        return (
          <div class={'cert' + (r.on ? '' : ' off')}>
            <div class="certhead">
              <label class="toggle"><input type="checkbox" checked={r.on} onChange={(e) => set(i, { ...r, on: (e.target as HTMLInputElement).checked })} /><strong>{r.title || 'Policy statement'}</strong></label>
              <span class={'pill' + (r.on ? ' on' : '')}>{r.on ? 'Printed in Section 6' : 'Not printed'}</span>
            </div>
            <div class="certgrid two">
              <label>Title<input type="text" value={r.title} onInput={(e) => set(i, { ...r, title: (e.target as HTMLInputElement).value })} /></label>
              <label>Reference<input type="text" value={r.ref} onInput={(e) => set(i, { ...r, ref: (e.target as HTMLInputElement).value })} /></label>
            </div>
            <ImagePick id={`${props.id}-${i}`} value={r.image} maxMB={5} onChange={(img) => set(i, { ...r, image: img })} onError={props.onError}
              fallback={builtIn} fallbackLabel={builtIn ? 'Built-in signed policy (Rev.00, 28.02.2024)' : 'No scan yet: the plan will say it is to be attached'} />
            {!builtIn && <div class="btnrow"><button type="button" class="btn small ghost" onClick={() => props.onChange(props.value.filter((_, j) => j !== i))}>Remove this policy</button></div>}
          </div>
        );
      })}
      <div class="btnrow">
        <button type="button" class="btn small" onClick={() => props.onChange([...props.value, { key: 'custom-' + uid(), title: '', ref: '', on: true, image: null }])}>Add another policy</button>
        <button type="button" class="btn small ghost" onClick={() => props.onChange(defaultPolicies())}>Reset to the four Oxypro policies</button>
      </div>
    </div>
  );
}

/** Code of practice for the fourth column of the table of contents, and the chapter of every section. */
export function CodeEditor(props: { code: CodeKey; name: string; chap: Record<string, string>; onChange: (code: CodeKey, name: string, chap: Record<string, string>) => void }) {
  const opt = CODE_OPTIONS.find((o) => o.key === props.code)!;
  const choose = (k: CodeKey) => props.onChange(k, codeHeading(k), chaptersFor(k));
  const setChap = (id: string, v: string) => props.onChange(props.code, props.name, { ...props.chap, [id]: v });
  const empty = SECTIONS.filter((s) => !(props.chap[s.id] || '').trim()).length;
  return (
    <div class="codeed" id="f-C01">
      <div class="certgrid two">
        <label>Code of practice<select value={props.code} onChange={(e) => choose((e.target as HTMLSelectElement).value as CodeKey)}>{CODE_OPTIONS.map((o) => <option value={o.key}>{o.label}</option>)}</select></label>
        {props.code !== 'none' && <label>Column heading<input type="text" value={props.name} onInput={(e) => props.onChange(props.code, (e.target as HTMLInputElement).value, props.chap)} /></label>}
      </div>
      {props.code === 'abudhabi' && <p class="help">Type the OSHAD-SF Code of Practice for each section (the Dubai chapters do not apply). {empty ? `${empty} sections still empty.` : ''}</p>}
      {props.code !== 'none' && (
        <details class="chapters" open={props.code !== 'dubai'}>
          <summary>Chapter / Code of Practice of each section ({opt.label})</summary>
          <div class="chapgrid">
            {SECTIONS.map((s) => (
              <label class={'lv' + s.level}><span>{s.title}</span><input type="text" value={props.chap[s.id] || ''} placeholder={s.level === 1 ? '' : 'e.g. Chapter 2'} onInput={(e) => setChap(s.id, (e.target as HTMLInputElement).value)} /></label>
            ))}
            <label class="lv1"><span>Appendices</span><input type="text" value={props.chap.app || ''} onInput={(e) => setChap('app', (e.target as HTMLInputElement).value)} /></label>
          </div>
          <div class="btnrow"><button type="button" class="btn small ghost" onClick={() => choose(props.code)}>Reset the chapters</button></div>
        </details>
      )}
    </div>
  );
}

