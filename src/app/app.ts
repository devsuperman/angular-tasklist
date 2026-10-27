import { ChangeDetectionStrategy, Component, LOCALE_ID, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LOCALES, LOCALE_KEY } from './core/i18n/locale';
import { StorageService } from './core/services/storage.service';
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
  private readonly storage = inject(StorageService);

  protected readonly title = signal('Tasklist');
  protected readonly theme = this.themeService.theme;
  protected readonly locales = LOCALES;
  protected readonly locale = inject(LOCALE_ID);

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  /** Translations are loaded before the app starts, so a new language needs a reload. */
  protected changeLocale(locale: string): void {
    this.storage.setItem(LOCALE_KEY, locale);
    location.reload();
  }

  /** In-page anchors ignore <base href>, so move the focus ourselves. */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  }
}
