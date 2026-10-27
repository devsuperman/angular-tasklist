import { pickLocale } from './locale';

describe('pickLocale', () => {
  it('prefers the saved choice', () => {
    expect(pickLocale('en-US', ['pt-BR'])).toBe('en-US');
    expect(pickLocale('pt-BR', ['en-US'])).toBe('pt-BR');
  });

  it('ignores an unsupported saved value and follows the browser', () => {
    expect(pickLocale('fr-FR', ['pt-PT', 'en'])).toBe('pt-BR');
    expect(pickLocale(null, ['de-DE', 'en-GB'])).toBe('en-US');
  });

  it('falls back to English', () => {
    expect(pickLocale(null, ['de-DE'])).toBe('en-US');
    expect(pickLocale(null, [])).toBe('en-US');
  });
});
