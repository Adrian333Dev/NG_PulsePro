import { HttpHeaders } from '@angular/common/http';

export function BuildAuthHttpHeaders(bearerToken: string) {
  return new HttpHeaders({
    Authorization: `Bearer ${bearerToken}`,
  });
}
