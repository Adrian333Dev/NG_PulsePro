import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxsModule, Store } from '@ngxs/store';
import { RouterModule } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';

import { AuthState } from './store';
import { AUTH_MODULE_CONFIG, IAuthModuleConfig } from './config';
import { AuthHttpInterceptor } from './interceptors';
import { initializeApp } from './config/auth.initializer';
import { LocalStorageService } from './services';

@NgModule({
  declarations: [],
  imports: [CommonModule, NgxsModule.forFeature([AuthState]), RouterModule],
})
export class AuthModule {
  static forRoot(
    config: IAuthModuleConfig
  ): ModuleWithProviders<AuthModule> {
    return {
      ngModule: AuthModule,
      providers: [
        // Make our configuration settings injectable inside our module
        { provide: AUTH_MODULE_CONFIG, useValue: config },
        // Register our Http Inteceptor globally
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthHttpInterceptor,
          multi: true,
        },
        // Register our App initializer globally and provide dependencies
        {
          provide: APP_INITIALIZER,
          useFactory: initializeApp,
          multi: true,
          // Pass the dependencies for our intializer function.
          // NOTE: Must be in the same order as the function
          // arguments (initializeApp).
          deps: [AUTH_MODULE_CONFIG, HttpClient, LocalStorageService, Store],
        },
      ],
    };
  }
}
