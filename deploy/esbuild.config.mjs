import esbuild from 'esbuild';
import { externalDeps } from './constrant.mjs';

const isNotProduction = process.env.NODE_ENV !== 'production';
const isProduction = !isNotProduction;

/**
 * @type {import('esbuild').BuildOptions}
 */
const config = {
  entryPoints: ['src/server.ts'],
  bundle: true,
  minify: isProduction,
  platform: 'node',
  target: 'es2023',
  outfile: 'dist/index.js',
  sourcemap: isNotProduction,
  tsconfig: 'tsconfig.json'
};

async function run() {
  await esbuild.build(
    externalDeps.length > 0 ? { ...config, external: externalDeps } : config
  );
  console.log('✅ esbuild: build completed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
