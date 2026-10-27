import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  protected readonly title = signal('Tasklist');
}
