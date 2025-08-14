import esbuild from 'esbuild';
import { EXTERNAL_DEPS } from './constrant.mjs';

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
  legalComments: 'linked',
  sourcemap: isNotProduction,
  tsconfig: 'tsconfig.json'
};

async function run() {
  await esbuild.build(
    EXTERNAL_DEPS.length > 0 ? { ...config, external: EXTERNAL_DEPS } : config
  );
  console.log('✅ esbuild: build completed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
