import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHandlerFn,
  HttpHeaders,
  HttpInterceptor,
  HttpInterceptorFn,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

import { BuildAuthHttpHeaders } from '@modules/auth/utils';
import { AuthService } from '@modules/auth/services';
import {
  AUTH_MODULE_CONFIG,
  BYPASS_AUTH_INTERCEPTOR,
  IAuthModuleConfig,
} from '@modules/auth/config';
import { ISignInRes } from '@modules/auth/dtos';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  constructor(private http: HttpClient, private authService: AuthService) {}

  // We use this to prevent multiple requests for refreshing
  isRefreshingAuthToken = false;

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Check context for Bypass
    // Earlier we've set up an `HttpContextToken`
    // We can check if it was passed in the HttpContext
    // and skip any logic defined in this interceptor.
    // Usage: `new HttpContext().set(BYPASS_AUTH_INTERCEPTOR, true);`
    if (req.context.get(BYPASS_AUTH_INTERCEPTOR) === true) {
      return next.handle(req);
    }

    // We are assuming here that all calls to our API start with `/api/`.
    // Http calls on the server side require a base url.
    // We are going to pass this to our request url.
    const API_URL = inject<IAuthModuleConfig>(AUTH_MODULE_CONFIG).apiUrl;

    // We only want to apply this logic for our backend
    // which means any request that starts with `/api/` in our case
    if (req.url?.startsWith('/api/')) {
      // Retrieve the `Access Token` from localStorage
      const accessToken = this.authService.retrieveAccessToken();
      // Build the request headers
      let headers = new HttpHeaders();

      // If an accessToken is found attach it to the request headers
      if (accessToken) {
        headers = BuildAuthHttpHeaders(accessToken);
      }

      // Request object is immutable by default. We therefore need to clone
      // it and override it with our settings.
      // 1. Add base url and replace `/api/` path
      // 2. Attach Auth headers
      req = req.clone({
        url: `${API_URL}${req.url.replace('/api/', '/')}`,
        headers: headers,
      });
    }

    // Return the cloned request and try to catch errors
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // Retrieve the refreshToken from localStorage
        const refreshToken = this.authService.retrieveRefreshToken();

        // If the error status code is 401 (Unauthorized) and a refreshToken
        // exists in our localStorage then try to request a new Access Token
        if (
          err.status == HttpStatusCode.Unauthorized &&
          refreshToken &&
          !this.isRefreshingAuthToken // To prevent multiple calls
        ) {
          this.isRefreshingAuthToken = true;

          // Call /auth/refresh endpoint to get new Access Token
          return this.http
            .get<Omit<ISignInRes, 'refresh'>>(`${API_URL}/auth/refresh`, {
              headers: BuildAuthHttpHeaders(refreshToken),
            })
            .pipe(
              switchMap((res) => {
                // Retry original request after new headers are set
                // from refresh endpoint
                if (res.accessToken) {
                  // Update our localStorage with new Tokens
                  this.authService.storeAccessTokens({
                    accessToken: res.accessToken,
                    refreshToken: refreshToken,
                  });

                  // Clone the request object with new tokens
                  // and retry the original url
                  req = req.clone({
                    headers: BuildAuthHttpHeaders(res.accessToken),
                  });
                }
                // Reset the isRefreshingAuthToken variable
                this.isRefreshingAuthToken = false;
                return next.handle(req);
              }),
              // If we catch an error at this point it means that
              // the user doesn't have permissions to access the requested
              // resource. It's up to you to determine what happens here.
              catchError(() => {
                return throwError(() => 'UNAUTHORIZED');
              })
            );
        }

        // If everything else fails reset and throw an error.
        this.isRefreshingAuthToken = false;
        return throwError(() => err);
      })
    );
  }
}

export const authHttpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  let isRefreshingAuthToken = false;
  const http = inject(HttpClient);
  const authService = inject(AuthService);
  const config = inject<IAuthModuleConfig>(AUTH_MODULE_CONFIG);

  // Check context for Bypass
  if (req.context.get(BYPASS_AUTH_INTERCEPTOR) === true) return next(req);

  // We only want to apply this logic for our backend
  if (req.url?.startsWith('/api/')) {
    const API_URL = config.apiUrl;
    const accessToken = authService.retrieveAccessToken();

    req = req.clone({
      url: `${API_URL}${req.url.replace('/api/', '/')}`,
      headers: accessToken ? BuildAuthHttpHeaders(accessToken) : undefined,
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const refreshToken = authService.retrieveRefreshToken();

      if (
        err.status == HttpStatusCode.Unauthorized &&
        refreshToken &&
        !isRefreshingAuthToken
      ) {
        isRefreshingAuthToken = true;

        return http
          .post<Omit<ISignInRes, 'refresh'>>(`${config.apiUrl}/auth/refresh`, {
            headers: BuildAuthHttpHeaders(refreshToken),
          })
          .pipe(
            switchMap((res) => {
              if (res.accessToken) {
                authService.storeAccessTokens({
                  accessToken: res.accessToken,
                  refreshToken: refreshToken,
                });

                req = req.clone({
                  headers: BuildAuthHttpHeaders(res.accessToken),
                });
              }
              isRefreshingAuthToken = false;
              return next(req);
            }),
            catchError(() => {
              return throwError(() => 'UNAUTHORIZED');
            })
          );
      }

      isRefreshingAuthToken = false;
      return throwError(() => err);
    })
  );
};
