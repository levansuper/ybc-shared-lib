import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  // Skip cleaning in watch mode: when `npm run dev` runs ybc-shared-lib#build
  // first (turbo dependsOn) and then ybc-shared-lib#dev (--watch), the watch
  // mode would otherwise wipe the freshly-built dist before re-emitting it,
  // leaving downstream tsc --watch consumers (balance-api, etc.) reading
  // empty types for a couple of seconds and caching them incorrectly.
  clean: !process.argv.includes('--watch'),
  splitting: false,
  sourcemap: true,
});
