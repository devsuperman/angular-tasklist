/** The languages the app ships with. The first one is the source language. */
export const LOCALES = [
  { id: 'en-US', label: 'English' },
  { id: 'pt-BR', label: 'Português (Brasil)' },
] as const;

export type AppLocale = (typeof LOCALES)[number]['id'];

export const LOCALE_KEY = 'angular-tasklist-locale';

/**
 * Runs before Angular starts (in main.ts), so it reads localStorage directly:
 * the saved choice first, then the browser's languages.
 */
export function pickLocale(
  saved: string | null = readSaved(),
  languages: readonly string[] = globalThis.navigator?.languages ?? [],
): AppLocale {
  const supported = LOCALES.map((l) => l.id as string);
  if (saved && supported.includes(saved)) return saved as AppLocale;
  for (const language of languages) {
    if (language.toLowerCase().startsWith('pt')) return 'pt-BR';
    if (language.toLowerCase().startsWith('en')) return 'en-US';
  }
  return 'en-US';
}

function readSaved(): string | null {
  try {
    return localStorage.getItem(LOCALE_KEY);
  } catch {
    return null;
  }
}
