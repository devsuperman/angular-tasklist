import { registerLocaleData } from '@angular/common';
import { loadTranslations } from '@angular/localize';
import { pickLocale } from './app/core/i18n/locale';

/**
 * Runtime i18n: one build for every language. Translations must be loaded *before*
 * any code that uses $localize runs, so the app itself is imported afterwards.
 */
async function start(): Promise<void> {
  const locale = pickLocale();
  if (locale === 'pt-BR') {
    const [messages, localeData] = await Promise.all([
      import('./locale/messages.pt-BR.json'),
      import('@angular/common/locales/pt'),
    ]);
    loadTranslations(messages.default.translations);
    registerLocaleData(localeData.default, 'pt-BR');
  }
  $localize.locale = locale; // the default LOCALE_ID reads this
  document.documentElement.lang = locale;

  const { bootstrap } = await import('./bootstrap');
  await bootstrap();
}

start().catch((err) => console.error(err));
