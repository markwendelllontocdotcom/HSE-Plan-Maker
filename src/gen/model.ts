/** Resolved document model shared by the Word and PDF writers. Sizes in twips unless noted. */
export type Run = { x: string; b?: 1; i?: 1; u?: 1; sz?: number; c?: string };
export interface CellPara { r: Run[]; jc?: string; li?: string }
/** vm: 'restart' starts a vertical merge (rowSpan) that the 'cont' cells below it continue */
export interface Cell { p: CellPara[]; fill?: string; span?: number; vm?: string; va?: string; color?: string; bold?: boolean }
export interface Row { c: Cell[]; header?: boolean; minH?: number }

export type Block =
  | { t: 'h'; lvl: 1 | 2; num: string; x: string; id: string; pbBefore?: boolean; mark?: string[] }
  | { t: 'p'; r: Run[]; l: number; h?: number; jc?: string; sz: number; keep?: boolean; before?: number; after?: number; pbBefore?: boolean; mark?: string[] }
  | { t: 'li'; k: 'bullet' | 'num' | 'arrow' | 'check'; label: string; seq: number; lvl: number; l: number; h: number; r: Run[]; sz: number; after?: number; mark?: string[] }
  | { t: 'tbl'; grid: number[]; rows: Row[]; jc?: string; ind?: number; sz?: number; mark?: string[] }
  | { t: 'img'; key: string; w: number; h: number; jc?: string; mark?: string[] }
  | { t: 'pb' }
  /** a new page in landscape (land) or portrait: a new section in Word */
  | { t: 'sect'; land: boolean };

export interface ImgAsset { bytes: Uint8Array; type: 'png' | 'jpeg'; w: number; h: number }

export interface CoverModel {
  boxes: [string, string][]; // Document No. / Revision / Date (typed; empty prints a blank box)
  title: string;
  photo: string | null;      // image key
  logos: string[];           // client / consultant logo keys
  parties: [string, string][];
  statement: string;
  status: string;
  signatures: { role: string; name: string; desig: string }[];
}

/** One row of the table of contents. group = the level-1 section the row belongs to (merged Section cell). */
export interface TocRow { id: string; end: string; num: string; title: string; lvl: 1 | 2; group: string; chap: string; leaf: boolean }

export interface DocModel {
  docNo: string;
  rev: string;
  footerLeft: string;
  title: string;
  cover: CoverModel;
  front: Block[];            // Document Control page (after the cover)
  toc: { code: string | null; rows: TocRow[] };
  banner: string;            // image key, full page width
  bannerLand: string;        // image key, the banner widened for landscape pages
  watermark: string | null;
  blocks: Block[];
  images: Record<string, ImgAsset>;
  /** page numbers from the PDF layout: heading id -> first page, end mark -> last page, and top offsets */
  pages?: Record<string, number>;
  meta: { project: string; company: string; created: string };
}

/** Platform services (browser or Node) used while building. */
export interface Platform {
  asset(name: 'banner' | 'logo' | 'watermark' | 'flowchart' | 'iso45001'): Promise<ImgAsset>;
  policy(key: string): Promise<ImgAsset | null>; // built-in policy statement scan, if any
  svgToPng(svg: string, w: number, h: number): Promise<ImgAsset>;
  dataUrlToAsset(dataUrl: string): Promise<ImgAsset>;
  fontCss(): Promise<string>; // @font-face rules (Carlito regular + bold) for SVG text
}

export const PAGE = { w: 11906, h: 16838, top: 1728, bottom: 1134, left: 1440, right: 994, header: 0, footer: 425 };
export const CONTENT_W = PAGE.w - PAGE.left - PAGE.right; // 9472 twips
/** landscape pages (the registers): same margins, page turned */
export const CONTENT_WL = PAGE.h - PAGE.left - PAGE.right; // 14404 twips
export const CONTENT_HL = PAGE.w - PAGE.top - PAGE.bottom; // 9044 twips
/** the header banner image: 1637 x 216 px drawn 614.1 pt wide from the page's left edge; the red bar is rows 90-139 */
export const BANNER = { px: 1637, pxH: 216, ptW: 614.1, ptH: 81.1, top: 13.04, barY: 90, barH: 50, bar: '#DA2025' };
export const BANNER_LAND_PX = Math.ceil((BANNER.px * (PAGE.h / 20)) / BANNER.ptW) + 2; // wide enough for a landscape page
export const NAVY = '002060';
export const CM = 1440 / 2.54; // twips per cm
/** Cover photo box as in the PQP: cell 16.5 cm wide x exactly 11.6 cm high, centred; photo stretched to 16 x 11 cm. */
export const COVER_BOX = { w: Math.round(16.5 * CM), h: Math.round(11.6 * CM), photoW: Math.round(16 * CM), photoH: Math.round(11 * CM) };
