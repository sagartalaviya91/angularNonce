import { ApplicationConfig, CSP_NONCE, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
function getNonce(){
  const metaTag = document.querySelector('meta[name=cspnonce]') as HTMLMetaElement;
  const cspNonce = metaTag.content;
  return cspNonce;
}
export const appConfig: ApplicationConfig = {
  providers: [
    // {
    //   provide:CSP_NONCE,
    //   useValue:getNonce()
    // },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
  ],
};
