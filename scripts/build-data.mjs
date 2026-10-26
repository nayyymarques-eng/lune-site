// Copies the moon engine output and the readings from the project files into src/data.
// Run when the calendar or the readings change: npm run data
import fs from 'node:fs';
const SRC = process.env.LUNE_FILES || '/mnt/project-files';
const cal = JSON.parse(fs.readFileSync(`${SRC}/leitura-das-luas/calendario-das-luas-2026-2030.json`, 'utf8'));
const read = JSON.parse(fs.readFileSync(`${SRC}/leitura-das-luas/leituras-en.json`, 'utf8'));
const moon = {
  phases: cal.phases.map(({ kind, utc, sign, degree, perigee_pct }) => ({ kind, utc, sign, degree, perigee_pct })),
  eclipses: cal.eclipses,
  ingresses: cal.moon_ingresses,
};
fs.writeFileSync('src/data/moon.json', JSON.stringify(moon));
const { phases, signs, houses, frames, origin, tone } = read;
fs.writeFileSync('src/data/readings.json', JSON.stringify({ phases, signs, houses, frames, origin, tone }, null, 1));
console.log('moon.json', moon.phases.length, 'phases,', moon.ingresses.length, 'ingresses');

// Legal pages come from Copy's launch texts (lancamento-en.md). Sections: 1.1 care, 2 privacy, 3 terms.
const launch = fs.readFileSync(`${SRC}/textos-do-app/lancamento-en.md`, 'utf8');
const section = (start, end) => launch.slice(launch.indexOf(start), launch.indexOf(end)).split('\n').slice(1).join('\n').replace(/\n---\s*$/m, '').trim();
fs.mkdirSync('src/content/legal', { recursive: true });
const legal = {
  care: ['Before you begin', section('### 1.1', '### 1.2')],
  privacy: ['Privacy policy', section('## 2. Privacy', '## 3. Terms')],
  terms: ['Terms of use', section('## 3. Terms', '## 4. App Store')],
};
for (const [slug, [title, body]] of Object.entries(legal)) {
  const clean = body.replace(/^\*\*(Lune: Moon Rituals · .*|Before you begin)\*\*\n/m, '').replace(/<small>(.*?)<\/small>/g, '$1').replace(/\s*\([^)]*Nayara[^)]*\)/g, '').replace(/^---$/gm, '').trim();
  fs.writeFileSync(`src/content/legal/${slug}.md`, `---\ntitle: "${title}"\n---\n\n${clean}\n`);
}
console.log('legal pages written');
