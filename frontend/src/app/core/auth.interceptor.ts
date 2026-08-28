import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/logout');
  // send the token over THREE channels at once; the server accepts whichever
  // survives the network (Authorization header / X-Auth-Token header / query param)
  const authReq = token
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}`, 'X-Auth-Token': token },
        setParams: { np_auth: token },
      })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthCall && auth.isLoggedIn) {
        auth.clearLocal();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
