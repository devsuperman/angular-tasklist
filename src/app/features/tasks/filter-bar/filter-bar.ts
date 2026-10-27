import { ChangeDetectionStrategy, Component, model } from '@angular/core';

export type StatusFilter = 'all' | 'pending' | 'done';

@Component({
  selector: 'app-filter-bar',
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  /** Two-way bound: `<app-filter-bar [(status)]="filter" />` */
  readonly status = model<StatusFilter>('all');

  protected readonly options: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: $localize`All` },
    { value: 'pending', label: $localize`Pending` },
    { value: 'done', label: $localize`Done` },
  ];
}
