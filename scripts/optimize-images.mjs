// Converts the full-size originals in /originals into responsive WebP files in
// /public/assets/img. Run with: npm run images
// Originals are not committed (they total ~64 MB). Keep them somewhere safe.

import sharp from 'sharp';
import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'originals');
const OUT = path.join(root, 'public', 'assets', 'img');

// name: output base name. src: original file. w: widths to generate.
// q: WebP quality. crop: [left, top, width, height] in original pixels.
// rotate: degrees clockwise. lossless-ish line art gets a higher quality.
const PHOTO = [480, 960];
const WIDE = [800, 1400, 2200];
const ART = [800, 1400, 2200];
const PAGE = [600, 1000];

const manifest = [
  // Hero + about
  { name: 'hero-wireframe', src: 'd8f34405ad50ead4ac5d8e20147a94ab.png', w: [800, 1576], q: 75, alphaQ: 70, whiteLines: true },
  { name: 'about-tower', src: 'ccf01a6bb3d3c5698a05458340487138.jpg', w: PHOTO, q: 78 },
  { name: 'about-headshot', src: '933c431955f4f169b2772817be85c0c6.jpg', w: [300], q: 85 },
  { name: 'about-environment', src: 'f9974320ae86f98503847641c504244f.jpg', w: PHOTO, q: 78 },
  { name: 'strip-barn', src: '8fdbf9227478177573a0e54b8aac747d.jpg', w: [480, 768], q: 76 },
  { name: 'strip-orientation', src: 'b260e30e32efab2491d7c36568b27718.jpg', w: [640, 1086], q: 76 },
  { name: 'strip-gala', src: 'e057318869431f0dd57fcaa78ae4932a.jpg', w: [640, 1200], q: 76 },
  { name: 'strip-cheer', src: 'dbfaba5ef9b7941d0716353bd8440379.jpg', w: [480, 900], q: 76 },
  { name: 'strip-crowd', src: 'ccb65bfdc1192273e977c06f59bb7683.jpg', w: [640, 1086], q: 76 },
  { name: 'contact-portrait', src: 'c04105dad75535f7f064e8dbc7abce04.jpg', w: [480, 960], q: 80 },

  // Hand drawings
  { name: 'drawing-courtyard', src: 'b31e9cb117b6145d8ab3a3116a7a8802.png', w: ART, q: 84 },
  { name: 'drawing-bridge', src: '4a32fd6047a163a5aa24960dfa37446b.png', w: [800, 1690], q: 84 },
  { name: 'drawing-house', src: '0f5374843c5e4747da58d11bdf784741.png', w: [800, 1708], q: 84 },

  // Project 01: Parking lot re-design
  { name: 'parking-render', src: 'f196fb1b180d93b3c700f9ff11defa01.jpg', w: [800, 1300], q: 80, crop: [34, 94, 1306, 866] },
  { name: 'parking-board', src: 'f196fb1b180d93b3c700f9ff11defa01.jpg', w: [1000, 1600, 2400], q: 86 },

  // Project 02: Eunoia Connection
  { name: 'eunoia-hero', src: '5eaaecbc21bcfe548d054fa3da584f9c.png', w: [800, 1670], q: 78 },
  { name: 'eunoia-concept', src: '6349d849c87796a5c93fa42b1ce04a49.png', w: [800, 1400, 1885], q: 82 },
  { name: 'eunoia-siteplan', src: '37d0acde98448f912ac274e8af6b85a4.png', w: ART, q: 82 },
  { name: 'eunoia-section', src: '6518eefd65cdf26be9717c4c69287b8f.png', w: ART, q: 84 },
  { name: 'eunoia-sketch', src: '288577e853315adcff82c234ede12bd7.png', w: ART, q: 82, rotate: -90 },
  { name: 'eunoia-render-bikes', src: '829d396cf715157be64e294c13160b04.png', w: [800, 1600], q: 78 },
  { name: 'eunoia-render-plaza', src: '8359f42051ef65aeaab4373d322e4e24.png', w: [800, 1600], q: 78 },
  { name: 'eunoia-poster', src: '3e7123830f987187489bbfc6154ad999.jpg', w: [600, 1200], q: 80 },

  // Project 03: The Urban Backyard
  { name: 'backyard-hero', src: 'b7aca86025222e0b4a2050672e5464fc.png', w: WIDE, q: 78 },
  { name: 'backyard-axon', src: '35970217d658eb3d82e3d7d18cc8d6c0.png', w: [800, 1400, 1982], q: 84 },
  { name: 'backyard-layers', src: 'e0407e0ca2dd0b74a92f31bda4d7e533.png', w: [500, 786], q: 84 },
  { name: 'backyard-sketch', src: '7a68edcef53b8c92fd6f9f112a100432.jpg', w: [600, 1200], q: 82 },

  // Project 04: Kiinomaage-aki
  { name: 'kiin-hero', src: '08a7644ebf1fea93441f21b680bff9ef.png', w: [800, 1400, 1920], q: 78 },
  { name: 'kiin-aerial', src: '6818222c9575b7ed453dbf4ace5e61ac.png', w: [800, 1600], q: 78 },
  { name: 'kiin-fire', src: '2e872ee90cde34aa95985839144b511f.png', w: [800, 1600], q: 78 },
  { name: 'kiin-garden', src: '2ccdea5afe93d0e49f3abbd6d770d187.png', w: [800, 1600], q: 78 },
  { name: 'kiin-siteplan', src: '97460401dc683abd286e8617bc5792f1.jpg', w: ART, q: 82 },

  // Graphic design
  { name: 'social-bike-lanes', src: '45af7e5210ed8eb081248e244863fb4e.png', w: [500, 1000], q: 82 },
  { name: 'social-gran-fondo', src: 'd939a42829d13a2b39d96849403c7029.png', w: [500, 1000], q: 82 },
  { name: 'infographic-play', src: '885a449bb8594fa01ebb63af59207e69.png', w: [900, 1500, 2044], q: 84 },

  // Reports
  { name: 'report-phase-1', src: '9ae11cea09555d3ec9a14cdbf142afb0.png', w: PAGE, q: 86 },
  { name: 'report-map', src: '1be2ee02f27cb564ff58a8289ec531bd.png', w: PAGE, q: 86 },
  { name: 'report-concept-plan', src: 'df372430dd0fcc066d91e01197955fb7.png', w: PAGE, q: 86 },
  { name: 'report-timeline', src: '663e9cea97c1152b1a925a58ecefa3c2.png', w: PAGE, q: 86 },
  { name: 'report-engagement', src: '0110cc10ac289ce2b604684f36c1177b.png', w: PAGE, q: 86 },
  { name: 'report-phase-3', src: '1ce73d010dc2923b31143d07446437a5.png', w: PAGE, q: 86 },
];

// Pass image names to rebuild only those, e.g. `npm run images -- hero-wireframe`.
const only = process.argv.slice(2);
if (!only.length) await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const have = new Set(await readdir(SRC));
const sizes = {};

for (const item of manifest) {
  if (only.length && !only.includes(item.name)) continue;
  if (!have.has(item.src)) throw new Error(`Missing original: ${item.src} (${item.name})`);
  // Each step writes a lossless PNG buffer so rotations and crops never stack lossy passes.
  const lossless = (img) => img.png({ compressionLevel: 0 }).toBuffer();
  let buf = await lossless(sharp(path.join(SRC, item.src)).rotate()); // apply EXIF orientation
  if (item.rotate) buf = await lossless(sharp(buf).rotate(item.rotate));
  if (item.crop) {
    const [left, top, width, height] = item.crop;
    buf = await lossless(sharp(buf).extract({ left, top, width, height }));
  }
  if (item.whiteLines) {
    // Line art on transparency: keep only the alpha channel and paint every line pure white.
    const { data, info } = await sharp(buf).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
    buf = await lossless(
      sharp({ create: { width: info.width, height: info.height, channels: 3, background: '#ffffff' } })
        .joinChannel(data, { raw: { width: info.width, height: info.height, channels: 1 } })
    );
  }
  const base = sharp(buf);
  const meta = await base.metadata();
  const srcW = meta.width;
  const widths = [...new Set(item.w.map((w) => Math.min(w, srcW)))];
  for (const w of widths) {
    const file = `${item.name}-${w}.webp`;
    await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: item.q, alphaQuality: item.alphaQ ?? 100, effort: 6, smartSubsample: true }).toFile(path.join(OUT, file));
  }
  sizes[item.name] = { widths, ratio: +(meta.height / meta.width).toFixed(4), w: srcW, h: meta.height };
  console.log(item.name.padEnd(22), widths.join(', '), `${srcW}x${meta.height}`);
}

const { writeFile } = await import('node:fs/promises');
if (!only.length) await writeFile(path.join(root, 'scripts', 'image-sizes.json'), JSON.stringify(sizes, null, 2));
