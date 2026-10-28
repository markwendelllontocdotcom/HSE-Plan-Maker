import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import type { RiskRow, EnvRow, RegMode } from '../model/types';
import { LIKELIHOOD, SEVERITY, ENV_SEVERITY, CONDITIONS, score, band, significant, riskRows, envRows } from '../content/registers';
import { riskIssues, envIssues } from '../model/fields';

/** What a register appendix prints after its two standard sentences. */
export function RegModePick(props: { id: string; value: RegMode; onChange: (v: RegMode) => void; name: string; scans: number }) {
  const opts: [RegMode, string, string][] = [
    ['register', `The ${props.name}`, 'Edit the rows below. Printed on landscape pages.'],
    ['scans', 'Scanned pages', props.scans ? `${props.scans} page${props.scans > 1 ? 's' : ''} added` : 'Add scans or screenshots of a signed register'],
    ['separate', 'Nothing more', 'The two sentences only: the register goes as a separate document'],
  ];
  return (
    <div class="regmode" role="radiogroup" id={props.id}>
      {opts.map(([k, label, help]) => (
        <label class={'regopt' + (props.value === k ? ' on' : '')}>
          <input type="radio" name={props.id} checked={props.value === k} onChange={() => props.onChange(k)} />
          <span><b>{label}</b><small>{help}</small></span>
        </label>
      ))}
    </div>
  );
}

const pad = (i: number) => String(i + 1).padStart(2, '0');

function RatePick(props: { label: string; value: number; scale: [number, string, string][]; onChange: (n: number) => void }) {
  return (
    <label class="rate">
      <span>{props.label}</span>
      <select value={String(props.value || 0)} onChange={(e) => props.onChange(+(e.target as HTMLSelectElement).value)}>
        <option value="0">–</option>
        {[...props.scale].sort((a, b) => b[0] - a[0]).map(([n, name, d]) => <option value={String(n)} title={d}>{n} {name}</option>)}
      </select>
    </label>
  );
}

/** Coloured score as on the printed register: LOW / MEDIUM / HIGH, or significant / not significant. */
export function ScorePill(props: { l: number; s: number; env?: boolean }) {
  const sc = score(props.l, props.s);
  if (!sc) return <span class="spill none">Not rated</span>;
  if (props.env) return <span class={'spill ' + (significant(sc) ? 'medium' : 'low')}>{sc} · {significant(sc) ? 'Significant' : 'Not significant'}</span>;
  const b = band(sc)!;
  return <span class={'spill ' + b.key.toLowerCase()}>{sc} · {b.key}</span>;
}

/** Rows as cards that open for editing, with move, remove, add and reset. */
function Cards<T>(props: { id: string; rows: T[]; onChange: (v: T[]) => void; blank: () => T; reset: () => T[]; resetLabel: string; addLabel: string;
  title: (r: T) => string; pills: (r: T) => ComponentChildren; bad: (r: T) => boolean; body: (r: T, set: (r: T) => void) => ComponentChildren; summary: ComponentChildren }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const rows = props.rows;
  const set = (i: number) => (r: T) => props.onChange(rows.map((x, j) => (j === i ? r : x)));
  const toggle = (i: number, on: boolean) => setOpen((o) => { const n = new Set(o); if (on) n.add(i); else n.delete(i); return n; });
  const move = (i: number, d: number) => {
    const n = [...rows]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); props.onChange(n);
    setOpen((o) => { const s = new Set<number>(); o.forEach((k) => s.add(k === i ? i + d : k === i + d ? i : k)); return s; });
  };
  const remove = (i: number) => {
    props.onChange(rows.filter((_, j) => j !== i));
    setOpen((o) => { const s = new Set<number>(); o.forEach((k) => { if (k < i) s.add(k); else if (k > i) s.add(k - 1); }); return s; });
  };
  const allOpen = rows.length > 0 && open.size === rows.length;
  return (
    <div class="reg" id={props.id}>
      <div class="regbar">
        <span class="regsum">{props.summary}</span>
        <button type="button" class="btn small ghost" onClick={() => setOpen(allOpen ? new Set() : new Set(rows.map((_, i) => i)))}>{allOpen ? 'Close all' : 'Open all'}</button>
      </div>
      {rows.map((r, i) => (
        <details class={'regrow' + (props.bad(r) ? ' bad' : '')} open={open.has(i)} onToggle={(e) => { const on = (e.currentTarget as HTMLDetailsElement).open; if (on !== open.has(i)) toggle(i, on); }}>
          <summary>
            <span class="regno">{pad(i)}</span>
            <span class="regtitle">{props.title(r) || <i>New row</i>}</span>
            <span class="regpills">{props.pills(r)}</span>
          </summary>
          <div class="regbody">
            {props.body(r, set(i))}
            <div class="btnrow">
              <button type="button" class="btn small ghost" disabled={i === 0} onClick={() => move(i, -1)}>▲ Move up</button>
              <button type="button" class="btn small ghost" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>▼ Move down</button>
              <button type="button" class="btn small ghost" onClick={() => remove(i)}>Remove row</button>
            </div>
          </div>
        </details>
      ))}
      <div class="btnrow">
        <button type="button" class="btn small" onClick={() => { props.onChange([...rows, props.blank()]); toggle(rows.length, true); }}>{props.addLabel}</button>
        <button type="button" class="btn small ghost" onClick={() => { if (confirm(`${props.resetLabel}? Your changes to the rows are replaced.`)) { props.onChange(props.reset()); setOpen(new Set()); } }}>{props.resetLabel}</button>
      </div>
    </div>
  );
}

const field = (label: string, el: ComponentChildren, wide = false) => <label class={'regf' + (wide ? ' wide' : '')}><span>{label}</span>{el}</label>;
const text = (v: string, on: (v: string) => void, ph = '') => <input type="text" value={v} placeholder={ph} onInput={(e) => on((e.target as HTMLInputElement).value)} />;
const area = (v: string, on: (v: string) => void, rows = 2, ph = '') => <textarea rows={rows} value={v} placeholder={ph} onInput={(e) => on((e.target as HTMLTextAreaElement).value)} />;

export function RiskRows(props: { id: string; value: RiskRow[]; onChange: (v: RiskRow[]) => void }) {
  const rows = props.value;
  const high = rows.filter((r) => band(score(r.L, r.S))?.key === 'HIGH').length;
  const highAfter = rows.filter((r) => band(score(r.L2, r.S2))?.key === 'HIGH').length;
  return (
    <Cards id={props.id} rows={rows} onChange={props.onChange} addLabel="Add risk" resetLabel="Reset to the standard register" reset={riskRows}
      blank={() => ({ activity: '', hazards: '', persons: '', L: 0, S: 0, controls: '', L2: 0, S2: 0, resp: '' })}
      summary={<>{rows.length} activities · {high} HIGH before controls · {highAfter ? <b class="bad">{highAfter} still HIGH after</b> : 'none HIGH after'}</>}
      title={(r) => r.activity}
      bad={(r) => riskIssues([r]).length > 0}
      pills={(r) => <><ScorePill l={r.L} s={r.S} /><span class="arrow">→</span><ScorePill l={r.L2} s={r.S2} /></>}
      body={(r, set) => (
        <div class="reggrid">
          {field('Activity / Task Step', text(r.activity, (v) => set({ ...r, activity: v })), true)}
          {field('Hazards / Risks', area(r.hazards, (v) => set({ ...r, hazards: v })), true)}
          {field('Persons at Risk', text(r.persons, (v) => set({ ...r, persons: v })))}
          {field('Person Responsible', text(r.resp, (v) => set({ ...r, resp: v })))}
          <div class="regrate"><b>Initial risk</b><RatePick label="L" value={r.L} scale={LIKELIHOOD} onChange={(n) => set({ ...r, L: n })} /><RatePick label="S" value={r.S} scale={SEVERITY} onChange={(n) => set({ ...r, S: n })} /><ScorePill l={r.L} s={r.S} /></div>
          {field('Control Measures (one per line)', area(r.controls, (v) => set({ ...r, controls: v }), 6), true)}
          <div class="regrate"><b>Residual risk</b><RatePick label="L" value={r.L2} scale={LIKELIHOOD} onChange={(n) => set({ ...r, L2: n })} /><RatePick label="S" value={r.S2} scale={SEVERITY} onChange={(n) => set({ ...r, S2: n })} /><ScorePill l={r.L2} s={r.S2} /></div>
        </div>
      )} />
  );
}

export function EnvRows(props: { id: string; value: EnvRow[]; onChange: (v: EnvRow[]) => void }) {
  const rows = props.value;
  const sig = rows.filter((r) => significant(score(r.L, r.S))).length;
  return (
    <Cards id={props.id} rows={rows} onChange={props.onChange} addLabel="Add aspect" resetLabel="Reset to the standard register" reset={envRows}
      blank={() => ({ activity: '', aspect: '', impact: '', cond: 'N', L: 0, S: 0, controls: '', legal: '', resp: '' })}
      summary={<>{rows.length} aspects · {sig} significant</>}
      title={(r) => [r.aspect, r.activity].filter(Boolean).join(' – ')}
      bad={(r) => envIssues([r]).length > 0}
      pills={(r) => <><span class="cond" title="Condition">{r.cond}</span><ScorePill l={r.L} s={r.S} env /></>}
      body={(r, set) => (
        <div class="reggrid">
          {field('Activity / Area', text(r.activity, (v) => set({ ...r, activity: v })), true)}
          {field('Environmental Aspect', text(r.aspect, (v) => set({ ...r, aspect: v })))}
          {field('Environmental Impact', text(r.impact, (v) => set({ ...r, impact: v })))}
          <div class="regrate">
            <label class="rate"><span>Condition</span><select value={r.cond} onChange={(e) => set({ ...r, cond: (e.target as HTMLSelectElement).value })}>{CONDITIONS.map(([k, n]) => <option value={k}>{k} {n}</option>)}</select></label>
            <RatePick label="L" value={r.L} scale={LIKELIHOOD} onChange={(n) => set({ ...r, L: n })} />
            <RatePick label="S" value={r.S} scale={ENV_SEVERITY} onChange={(n) => set({ ...r, S: n })} />
            <ScorePill l={r.L} s={r.S} env />
          </div>
          {field('Control Measures (one per line)', area(r.controls, (v) => set({ ...r, controls: v }), 5), true)}
          {field('Legal & Other Requirements', area(r.legal, (v) => set({ ...r, legal: v })))}
          {field('Responsible', text(r.resp, (v) => set({ ...r, resp: v })))}
        </div>
      )} />
  );
}
