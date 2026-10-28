// Every internal link and image in the built site must point at a real file. Run after npm run build.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : files.push(path.join(d, e.name))));
walk(DIST);
const exists = (p) => {
  const f = path.join(DIST, decodeURIComponent(p));
  return fs.existsSync(f) && (fs.statSync(f).isFile() || fs.existsSync(path.join(f, 'index.html')));
};
const broken = [];
for (const f of files.filter((x) => x.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
    if (url.startsWith('//') || url.startsWith('/api/')) continue;
    if (!exists(url)) broken.push(`${f.slice(DIST.length)} -> ${url}`);
  }
}
if (broken.length) {
  console.error(`Broken links (${broken.length}):\n` + [...new Set(broken)].join('\n'));
  process.exit(1);
}
console.log(`Links OK in ${files.filter((x) => x.endsWith('.html')).length} pages.`);
