import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * A box with three slots:
 * - `[card-title]` for the heading,
 * - the default slot for the body,
 * - `[card-actions]` for buttons at the bottom.
 */
@Component({
  selector: 'app-card',
  template: `
    <header class="card-title"><ng-content select="[card-title]" /></header>
    <div class="card-body"><ng-content /></div>
    <footer class="card-actions"><ng-content select="[card-actions]" /></footer>
  `,
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {}
