import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  template: `
    @if (isLoading()) {
      <div class="bar" role="progressbar" aria-label="Loading" i18n-aria-label></div>
    }
  `,
  styles: `
    .bar {
      position: fixed;
      inset: 0 0 auto;
      z-index: 1000;
      height: 3px;
      background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
      background-size: 50% 100%;
      animation: slide 1s linear infinite;
    }
    @keyframes slide {
      from {
        background-position: -50% 0;
      }
      to {
        background-position: 150% 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBarComponent {
  protected readonly isLoading = inject(LoadingService).isLoading;
}
