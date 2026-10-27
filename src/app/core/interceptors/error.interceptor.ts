import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        toast.error(
          error.status === 0
            ? $localize`You seem to be offline. Could not load the demo data.`
            : $localize`Could not load the demo data (error ${error.status}:status:).`,
        );
      }
      return throwError(() => error); // the caller (or the resource) still sees the error
    }),
  );
};
