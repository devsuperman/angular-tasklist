import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <h2 i18n>Page not found</h2>
    <p i18n>There is nothing at this address.</p>
    <a routerLink="/tasks" i18n>Go to your tasks</a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
