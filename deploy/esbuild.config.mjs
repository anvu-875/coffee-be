import esbuild from 'esbuild';
import { EXTERNAL_DEPS, PROD_DIR } from './constrant.mjs';

const isNotProduction = process.env.NODE_ENV !== 'production';
const isProduction = !isNotProduction;

const externalDeps = EXTERNAL_DEPS.map((dep) => {
  if (dep.startsWith('@')) {
    const secondAt = dep.indexOf('@', 1); // find the second @
    if (secondAt === -1) return dep; // no version
    return dep.slice(0, secondAt); // cut to before version
  } else {
    const atIndex = dep.lastIndexOf('@');
    if (atIndex === -1) return dep;
    return dep.slice(0, atIndex);
  }
});


/**
 * @type {import('esbuild').BuildOptions}
 */
const config = {
  entryPoints: ['src/server.ts'],
  bundle: true,
  minify: isProduction,
  platform: 'node',
  target: 'es2023',
  outfile: `${PROD_DIR}/index.js`,
  legalComments: 'linked',
  sourcemap: isNotProduction,
  tsconfig: 'tsconfig.json'
};

async function run() {
  await esbuild.build(
    EXTERNAL_DEPS.length > 0 ? { ...config, external: externalDeps } : config
  );
  console.log('✅ esbuild: build completed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
