import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

import {
  ACCESS_TOKEN_KEY,
  AUTH_MODULE_CONFIG,
  IAuthModuleConfig,
  REFRESH_TOKEN_KEY,
} from '@modules/auth/config';
import { LocalStorageService } from './local-storage.service';
import { ISignInInput, ISignInRes } from '../dtos';
import { AuthStateActionLogout, AuthStateActionSetUser } from '../store';
import { IUser } from '@app/shared/models';
import { ENDPOINTS } from '@app/core/constants';

Injectable({ providedIn: 'root' });
export class AuthService {
  constructor(
    @Inject(AUTH_MODULE_CONFIG) private moduleConfig: IAuthModuleConfig,

    private http: HttpClient,
    private router: Router,
    private store: Store,
    private lsService: LocalStorageService
  ) {}

  /**
   * sign in a user
   * @param dto The credentials interface
   * @param next Optionaly pass a redirect url after successful sign in
   */
  signIn(dto: ISignInInput, next?: string) {
    return this.http.post<ISignInRes>(ENDPOINTS.AUTH.SIGN_IN, dto).pipe(
      switchMap((res) => {
        if (res) {
          // Store the credentials locally
          this.storeAccessTokens(res);
        }
        // Get the user's profile
        return this.me();
      }),
      tap((user) => {
        // Dispatch a store action to set the user
        this.store.dispatch(new AuthStateActionSetUser(user!));

        // Optionally navigate to a url on success
        if (next) this.router.navigateByUrl(next);
      })
    );
  }

  /**
   * Retrieves the current user's profile.
   */
  me() {
    return this.http.get<IUser>(ENDPOINTS.AUTH.ME).pipe(
      // In case we get an HTTP response like 401
      // Dispatch an event to log out the current user.
      catchError(() => {
        this.store.dispatch(new AuthStateActionLogout());
        return of(null);
      })
    );
  }

  /**
   * Clear all tokens stored locally
   * Dispatch the logout action
   * Navigate away (afterLogoutRedirect from our module config)
   */
  logout() {
    this.clearAccessTokens();
    this.store.dispatch(new AuthStateActionLogout());
    this.router.navigateByUrl(this.moduleConfig.afterLogoutRedirect);
  }

  // Store the JWT tokens locally
  storeAccessTokens({ accessToken, refreshToken}: ISignInRes) {
    this.lsService.setItem(ACCESS_TOKEN_KEY, accessToken);
    this.lsService.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Retrieve the Access Token
  retrieveAccessToken() {
    return this.lsService.getItem(ACCESS_TOKEN_KEY);
  }

  // Retrieve the Refresh Token
  retrieveRefreshToken() {
    return this.lsService.getItem(REFRESH_TOKEN_KEY);
  }

  // Clear all stored tokens
  clearAccessTokens() {
    this.lsService.removeItem(ACCESS_TOKEN_KEY);
    this.lsService.removeItem(REFRESH_TOKEN_KEY);
  }
}
