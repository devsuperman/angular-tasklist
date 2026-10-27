import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { LoadingBarComponent } from './shared/components/loading-bar/loading-bar';
import { ToastOutletComponent } from './shared/components/toast/toast-outlet';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LoadingBarComponent, ToastOutletComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly themeService = inject(ThemeService);

  protected readonly title = signal('Tasklist');
  protected readonly theme = this.themeService.theme;

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  /** In-page anchors ignore <base href>, so move the focus ourselves. */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  }
}
