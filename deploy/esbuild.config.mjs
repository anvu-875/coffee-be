import esbuild from 'esbuild';
import external from './external-deps.mjs';

/**
 * @type {import('esbuild').BuildOptions}
 */
const config = {
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'es2023',
  outfile: 'dist/index.js',
  sourcemap: process.env.NODE_ENV != 'production',
  tsconfig: 'tsconfig.json'
};

async function run() {
  await esbuild.build(external.length > 0 ? { ...config, external } : config);
  console.log('✅ esbuild: build completed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
