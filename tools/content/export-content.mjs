// Exports read-only content of the frontend prototype (mZUS dla Rodzica) to the backend content files:
// - knowledge.json: the "Wiedza" tab (js/wiedza.js: chapters and articles),
// - dictionaries.json: form glossary, facts, support organisations, helplines, links (js/data.js) and week cards
//   (js/wiedza.js).
//
// Usage: node tools/content/export-content.mjs <path-to-mockup-directory>
// Output: src/main/resources/content/*.json (committed; the application does not need Node).
//
// Link keys of the articles are resolved to { url, label }, so the backend serves self-contained articles.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const mockupDir = process.argv[2];
if (!mockupDir) {
  console.error('Usage: node tools/content/export-content.mjs <path-to-mockup-directory>');
  process.exit(1);
}
const W = await import(pathToFileURL(resolve(mockupDir, 'js', 'wiedza.js')).href);
const D = await import(pathToFileURL(resolve(mockupDir, 'js', 'data.js')).href);
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/main/resources/content');
const write = (name, content) => {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, name), JSON.stringify(content, null, 2) + '\n');
};

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
write('knowledge.json', content);
console.log(`knowledge.json: ${content.chapters.length} chapters, ${content.articles.length} articles`);

// Week cards: "to" of the last child card (999 months) means "no upper limit" and is left out.
const articleIds = new Set(W.ARTICLES.map((a) => a.id));
const OPEN_END = 999;
const weekCards = (cards) => cards.map((c) => {
  if (!articleIds.has(c.art)) throw new Error(`Week card ${c.title}: unknown article ${c.art}`);
  return { from: c.from, ...(c.to >= OPEN_END ? {} : { to: c.to }), articleId: c.art, title: c.title, text: c.text };
});
const dictionaries = {
  source: 'js/data.js and js/wiedza.js of the frontend prototype',
  forms: Object.entries(D.FORMS).map(([code, description]) => ({ code, description })),
  facts: D.FACTS,
  organizations: D.SUPPORT_ORGS.map(({ name, topic, url }) => ({ name, topic, ...(url ? { url } : {}) })),
  helplines: D.HELPLINES.map(([number, description]) => ({ number, description })),
  links: D.LINKS.map(([label, url]) => ({ url, label })),
  weekCards: { pregnancy: weekCards(W.CARDS_POR.ciaza), child: weekCards(W.CARDS_POR.dziecko) },
};
write('dictionaries.json', dictionaries);
console.log(`dictionaries.json: ${dictionaries.forms.length} forms, ${dictionaries.facts.length} facts, `
  + `${dictionaries.organizations.length} organizations, ${dictionaries.helplines.length} helplines, `
  + `${dictionaries.links.length} links, ${dictionaries.weekCards.pregnancy.length + dictionaries.weekCards.child.length} week cards`);
