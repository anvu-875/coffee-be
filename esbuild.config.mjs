import esbuild from 'esbuild';
import { tsPathsPlugin } from '@awalgawe/esbuild-typescript-paths-plugin';

/**
 * @type {import('esbuild').BuildOptions}
 */
const config = {
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: 'es2023',
  outfile: 'dist/index.js',
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  external: [
    'express',
    'swagger-ui-express',
    'swagger-jsdoc',
    '@prisma/client',
    'swagger-docs.json'
  ],
  plugins: [tsPathsPlugin()]
};

async function run() {
  await esbuild.build(config);
  console.log('✅ esbuild: build completed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
