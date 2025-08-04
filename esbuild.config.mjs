import esbuild from 'esbuild';

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
  ]
};

async function run() {
  await esbuild.build(config);
  console.log('✅ esbuild: build completed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
