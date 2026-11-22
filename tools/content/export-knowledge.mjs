// Exports the "Wiedza" tab of the frontend prototype (mZUS dla Rodzica, js/wiedza.js) to the backend content file.
//
// Usage: node tools/content/export-knowledge.mjs <path-to-mockup-directory>
// Output: src/main/resources/content/knowledge.json (committed; the application does not need Node).
//
// Link keys of the articles are resolved to { url, label }, so the backend serves self-contained articles.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const mockupDir = process.argv[2];
if (!mockupDir) {
  console.error('Usage: node tools/content/export-knowledge.mjs <path-to-mockup-directory>');
  process.exit(1);
}
const W = await import(pathToFileURL(resolve(mockupDir, 'js', 'wiedza.js')).href);
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/main/resources/content/knowledge.json');

const chapterIds = new Set(W.CHAPTERS.map((c) => c.id));
const link = (key) => {
  const value = W.ZUS_LINKS[key];
  if (!value) throw new Error(`Unknown link key: ${key}`);
  return { url: value[0], label: value[1] };
};
const content = {
  source: 'js/wiedza.js of the frontend prototype (Poradnik ZUS dla rodziców, stan prawny 1.04.2026)',
  chapters: W.CHAPTERS.map(({ id, title, icon, lead }) => ({ id, title, icon, lead })),
  articles: W.ARTICLES.map((a) => {
    if (!chapterIds.has(a.ch)) throw new Error(`Article ${a.id}: unknown chapter ${a.ch}`);
    return {
      id: a.id,
      chapterId: a.ch,
      title: a.title,
      lead: a.lead,
      body: a.body.trim(),
      source: a.src,
      links: (a.links || []).map(link),
      action: a.action ? { href: a.action[0], label: a.action[1] } : null,
    };
  }),
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(content, null, 2) + '\n');
console.log(`knowledge.json: ${content.chapters.length} chapters, ${content.articles.length} articles`);
