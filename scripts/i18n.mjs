// Builds src/locale/messages.pt-BR.json from the extracted messages.json and a
// translation table keyed by the English text (so it survives regenerated ids).
// Usage: npm run i18n   (extracts, then runs this script)
import { readFileSync, writeFileSync } from 'node:fs';

const source = JSON.parse(readFileSync('src/locale/messages.json', 'utf8'));
const table = JSON.parse(readFileSync('scripts/pt-BR.translations.json', 'utf8'));

const translations = {};
const missing = [];
for (const [id, text] of Object.entries(source.translations)) {
  if (text in table) translations[id] = table[text];
  else missing.push(text);
}

writeFileSync(
  'src/locale/messages.pt-BR.json',
  JSON.stringify({ locale: 'pt-BR', translations }, null, 2) + '\n',
);

if (missing.length) {
  console.error(`Missing pt-BR translations (${missing.length}):`);
  for (const text of missing) console.error(`  ${JSON.stringify(text)}`);
  process.exit(1);
}
console.log(`pt-BR: ${Object.keys(translations).length} messages translated.`);
