/// <reference types="vite/client" />

import type { ScritturaApi } from './shared/api';

declare global {
  interface Window {
    scrittura: ScritturaApi;
  }
}

export {};
