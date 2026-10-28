import type { Project } from './model/types';
import { deflate, toBase64Url, hasShareHash } from './importers';
import { WEB_URL, APP_NAME, APP_VERSION } from './version';
import { TITLE } from './content/build';
import { bytesToBase64 } from './content/svgs';

/**
 * Sharing a plan:
 *  - Email with the PDF attached: the system share sheet (iPhone, iPad, Android, Windows Edge / Chrome) offers
 *    Outlook, Mail, Teams and so on. On a laptop an Outlook draft (.eml with the PDF inside) opens a new email with
 *    the PDF already attached.
 *  - A link: the web version of HSE Plan Maker with the plan's text in the part after # (never sent to a server).
 *    Photos, logos and scans stay out of the link to keep it short.
 */
export function mailSubject(p: Project): string {
  return `${TITLE} – ${p.P01.trim() || 'Project'}${p.D01.trim() ? ` – ${p.D01.trim()}` : ''}${p.D03.trim() ? ` Rev ${p.D03.trim()}` : ''}`;
}
export function mailBody(p: Project, withLink = ''): string {
  return [
    'Dear Sir / Madam,',
    '',
    `Please find ${withLink ? 'below the link to' : 'attached'} the ${TITLE} for ${p.P01.trim() || 'the project'}${p.D01.trim() ? ` (${p.D01.trim()}${p.D03.trim() ? `, Rev ${p.D03.trim()}` : ''})` : ''} for your review.`,
    ...(withLink ? ['', withLink] : []),
    '',
    'Best regards,',
  ].join('\r\n');
}

/** True when this browser can hand a PDF to the share sheet. */
export function canShareFile(): boolean {
  try {
    const f = new File([new Uint8Array([37, 80, 68, 70])], 'test.pdf', { type: 'application/pdf' });
    return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [f] });
  } catch { return false; }
}

export async function shareFile(bytes: Uint8Array, name: string, p: Project): Promise<'shared' | 'cancelled'> {
  const file = new File([bytes as BlobPart], name, { type: 'application/pdf' });
  try {
    await navigator.share({ files: [file], title: mailSubject(p), text: mailBody(p) });
    return 'shared';
  } catch (e: any) {
    if (e?.name === 'AbortError') return 'cancelled';
    throw e;
  }
}

/** An unsent email (.eml): Outlook and Windows Mail open it as a new email with the PDF attached. */
export function emlDraft(bytes: Uint8Array, name: string, p: Project): string {
  const b64 = bytesToBase64(bytes).replace(/.{76}/g, '$&\r\n');
  const boundary = '----=_HSEPlanMaker_' + Date.now().toString(36);
  const enc = (s: string) => `=?UTF-8?B?${bytesToBase64(new TextEncoder().encode(s))}?=`;
  const body = bytesToBase64(new TextEncoder().encode(mailBody(p))).replace(/.{76}/g, '$&\r\n');
  return [
    'X-Unsent: 1',
    'To: ',
    `Subject: ${enc(mailSubject(p))}`,
    `X-Mailer: ${APP_NAME} ${APP_VERSION}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    'Content-Transfer-Encoding: base64',
    '',
    body,
    '',
    `--${boundary}`,
    `Content-Type: application/pdf; name="${name.replace(/"/g, '')}"`,
    `Content-Disposition: attachment; filename="${name.replace(/"/g, '')}"`,
    'Content-Transfer-Encoding: base64',
    '',
    b64,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

/** The plan without photos, logos and scans (for links). */
export function textOnly(p: Project): Project {
  return { ...p, R07: null, R08: null, R09: null, R10: null, R12: null, A02: [], A03: [], POL: p.POL.map((x) => ({ ...x, image: null })) };
}

/** Link to the web version that opens this plan (text only). */
export async function shareLink(p: Project): Promise<string> {
  const json = JSON.stringify({ format: 'hse-plan-maker-project', version: 1, app: `${APP_NAME} ${APP_VERSION}`, project: textOnly(p) });
  const z = await deflate(json);
  return z ? `${WEB_URL}#hse=${toBase64Url(z)}` : `${WEB_URL}#hse-json=${toBase64Url(new TextEncoder().encode(json))}`;
}

/** Reads a shared plan from the address (#hse=). */
export async function readShareHash(hash: string): Promise<Project> {
  const m = (hash || '').match(/#hse(-json)?=([A-Za-z0-9_-]+)/);
  if (!m || !hasShareHash(hash)) throw new Error('The link is incomplete. Ask for the link again.');
  const b = atob(m[2].replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((m[2].length + 3) % 4));
  const bytes = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
  let text: string;
  if (m[1]) text = new TextDecoder().decode(bytes);
  else {
    const DS = (globalThis as any).DecompressionStream;
    if (!DS) throw new Error('This browser cannot open the link. Use Edge, Chrome or Safari.');
    text = await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(new DS('deflate-raw'))).text();
  }
  const j = JSON.parse(text);
  if (j?.format !== 'hse-plan-maker-project' || !j.project) throw new Error('This link does not hold an HSE plan.');
  return j.project as Project;
}
