import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: directory,
  envDir: directory,
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(directory, 'src') } },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 5173),
    allowedHosts: true,
  },
  build: { outDir: 'dist' },
});
