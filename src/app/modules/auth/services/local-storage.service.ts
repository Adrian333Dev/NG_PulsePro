import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  get length(): number {
    return this.document?.defaultView?.localStorage?.length || 0;
  }

  getItem(key: string): string | null {
    return this.document?.defaultView?.localStorage?.getItem(key) || null;
  }

  setItem(key: string, val: string): void {
    this.document?.defaultView?.localStorage?.setItem(key, val);
  }

  removeItem(key: string): void {
    this.document?.defaultView?.localStorage?.removeItem(key);
  }

  clear(): void {
    this.document?.defaultView?.localStorage?.clear();
  }
}
