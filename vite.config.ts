import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import placeholderGuard from './scripts/placeholder-guard';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), placeholderGuard()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  ssgOptions: {
    // The Vite entry that exports `createRoot` (default is src/main.ts).
    entry: 'src/main.tsx',
    // /about -> dist/about/index.html (unambiguous with Netlify static serving).
    dirStyle: 'nested',
    // Load the hydration script without blocking first paint.
    script: 'async',
  },
});
