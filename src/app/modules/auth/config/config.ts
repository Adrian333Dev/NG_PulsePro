import { HttpContextToken } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

// Define a token for inject the module settings in other classes
export const AUTH_MODULE_CONFIG = new InjectionToken('AUTH_MODULE_CONFIG');

// This interface defines our configuration object that needs to be passed
// to our module on initialization. Add any setting here that is not
// constant and you might want to configure differently for each app.
// For example:
export interface IAuthModuleConfig {
  apiUrl: string;
  loginRedirect: string;
  afterLogoutRedirect: string;
  unauthorizedRedirect: string;
}

// Define some constant keys that will be used to retreive the tokens
// from the client's localStorage or cookies
export const ACCESS_TOKEN_KEY = 'authAccess';
export const REFRESH_TOKEN_KEY = 'authRefresh';

// This is a context token we can pass to angular's HttpClient context
// to tell it to bypass authentication checks.
export const BYPASS_AUTH_INTERCEPTOR = new HttpContextToken(() => false);
