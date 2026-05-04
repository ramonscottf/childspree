import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When CAPACITOR=1 is set (during native shell builds), use relative asset paths
// so the WebView can resolve files from its bundled origin. Web deploys keep
// absolute paths so Cloudflare Pages / SPA routing works correctly.
const isCapacitor = process.env.CAPACITOR === '1';

export default defineConfig({
  plugins: [react()],
  base: isCapacitor ? './' : '/',
  build: {
    outDir: 'dist',
  },
});
