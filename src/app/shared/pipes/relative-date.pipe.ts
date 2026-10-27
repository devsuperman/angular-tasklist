import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { todayIso } from '../../core/utils/date';

const DAY_MS = 86_400_000;

/** '2026-10-28' → "tomorrow", "in 3 days", "yesterday"... in the app's language. */
@Pipe({ name: 'relativeDate' })
export class RelativeDatePipe implements PipeTransform {
  private readonly format = new Intl.RelativeTimeFormat(inject(LOCALE_ID), { numeric: 'auto' });

  transform(isoDate: string | undefined | null, today: string = todayIso()): string {
    if (!isoDate) return '';
    // Both are plain dates, so parse them the same way (UTC midnight) and count whole days
    const days = Math.round((Date.parse(isoDate) - Date.parse(today)) / DAY_MS);
    if (Number.isNaN(days)) return '';
    if (Math.abs(days) >= 60) return this.format.format(Math.round(days / 30), 'month');
    if (Math.abs(days) >= 14) return this.format.format(Math.round(days / 7), 'week');
    return this.format.format(days, 'day');
  }
}
