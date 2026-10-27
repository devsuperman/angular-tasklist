import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';
import { errorInterceptor } from './error.interceptor';
import { loadingInterceptor } from './loading.interceptor';

describe('interceptors', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let toast: ToastService;
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
    loading = TestBed.inject(LoadingService);
  });

  afterEach(() => backend.verify());

  it('shows the loading state until every request ends', () => {
    http.get('a').subscribe();
    http.get('b').subscribe();
    expect(loading.isLoading()).toBe(true);
    backend.expectOne('a').flush({});
    expect(loading.isLoading()).toBe(true);
    backend.expectOne('b').flush({});
    expect(loading.isLoading()).toBe(false);
  });

  it('shows a toast for an HTTP error and still passes the error on', () => {
    const errorSpy = vi.fn();
    http.get('seed.json').subscribe({ error: errorSpy });
    backend.expectOne('seed.json').flush('nope', { status: 500, statusText: 'Server Error' });

    expect(toast.toasts().map((t) => t.message)).toEqual([
      'Could not load the demo data (error 500).',
    ]);
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(loading.isLoading()).toBe(false);
  });

  it('says when the user seems offline', () => {
    http.get('seed.json').subscribe({ error: () => undefined });
    backend.expectOne('seed.json').error(new ProgressEvent('error'));
    expect(toast.toasts()[0].message).toContain('offline');
  });
});
