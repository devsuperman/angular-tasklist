import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RelativeDatePipe } from './relative-date.pipe';

describe('RelativeDatePipe', () => {
  // The pipe calls inject(LOCALE_ID), so create it in an injection context
  const create = () => TestBed.runInInjectionContext(() => new RelativeDatePipe());

  it.each([
    ['2026-10-27', 'today'],
    ['2026-10-28', 'tomorrow'],
    ['2026-10-26', 'yesterday'],
    ['2026-10-30', 'in 3 days'],
    ['2026-10-20', '7 days ago'],
    ['2026-11-17', 'in 3 weeks'],
    ['2027-01-15', 'in 3 months'],
  ])('%s → %s', (date, expected) => {
    expect(create().transform(date, '2026-10-27')).toBe(expected);
  });

  it('returns an empty string without a date', () => {
    expect(create().transform(undefined)).toBe('');
    expect(create().transform('')).toBe('');
  });

  it('follows LOCALE_ID', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }] });
    expect(create().transform('2026-10-28', '2026-10-27')).toBe('amanhã');
  });
});
