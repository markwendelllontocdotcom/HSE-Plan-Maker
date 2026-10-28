import { readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import type { Platform, ImgAsset } from '../src/gen/model';
import { imageInfo } from '../src/gen/imgsize';
import { base64ToBytes } from '../src/content/svgs';
import vfs from '../src/fonts/vfs.json';

const root = new URL('..', import.meta.url).pathname;
const file = (n: string): ImgAsset => {
  const bytes = new Uint8Array(readFileSync(root + 'src/assets/' + n));
  return { bytes, ...imageInfo(bytes) };
};
export const nodePlatform: Platform = {
  async asset(name) {
    return file(({ banner: 'banner-default.jpg', logo: 'logo-default.png', watermark: 'watermark-default.jpg', flowchart: 'flowchart.png', iso45001: 'certs/iso45001.jpg' } as any)[name]);
  },
  async policy(key) {
    const f: Record<string, string> = { ohs: 'policies/policy-ohs.jpg', env: 'policies/policy-env.jpg', sus: 'policies/policy-sus.jpg', welfare: 'policies/policy-welfare.jpg' };
    return f[key] ? file(f[key]) : null;
  },
  async svgToPng(svg, w) {
    const r = new Resvg(svg, {
      fitTo: { mode: 'width', value: w },
      font: { fontFiles: ['/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf', '/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf'], loadSystemFonts: false, defaultFontFamily: 'Carlito' },
    });
    const bytes = new Uint8Array(r.render().asPng());
    return { bytes, ...imageInfo(bytes) };
  },
  async dataUrlToAsset(dataUrl) {
    const bytes = base64ToBytes(dataUrl.split(',')[1]);
    return { bytes, ...imageInfo(bytes) };
  },
  async fontCss() {
    const v: any = vfs;
    return `@font-face{font-family:'Carlito';font-weight:400;src:url(data:font/ttf;base64,${v['Carlito-Regular.ttf']}) format('truetype');}@font-face{font-family:'Carlito';font-weight:700;src:url(data:font/ttf;base64,${v['Carlito-Bold.ttf']}) format('truetype');}`;
  },
};
