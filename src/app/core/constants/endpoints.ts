import { environment } from 'src/environments/environment.development';

export const API_URL = `${environment.baseUrl}/api`;
export const AUTH_URL = `${environment.baseUrl}/auth`;

export const ENDPOINTS = {
  AUTH: {
    SIGN_IN: `${AUTH_URL}/sign-in`,
    SIGN_UP: `${AUTH_URL}/sign-up`,
    REFRESH: `${AUTH_URL}/refresh`,
    ME: `${AUTH_URL}/me`,
  },
};
