// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  site: 'https://saberzou.github.io',
  base: '/axiom-thoughts',
  integrations: [react()],
});
