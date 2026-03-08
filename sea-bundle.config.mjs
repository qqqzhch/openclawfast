import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'D:/code/openclawCli/openclaw/dist/entry.js',
  output: {
    file: 'D:/code/openclawCli/openclaw/dist/sea-bundle.js',
    format: 'esm',
    platform: 'node',
    target: 'node22',
    inlineDynamicImports: true,
  },
  platform: 'node',
  target: 'node22',
  external: [
    // Keep native modules external
    /^node:/,
    'fsevents',
    '@napi-rs/canvas',
    '@napi-rs/image',
    'better-sqlite3',
    'sharp',
  ],
  minify: false,
  sourcemap: false,
});