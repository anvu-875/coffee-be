import esbuild from 'esbuild';
import { tsPathsPlugin } from '@awalgawe/esbuild-typescript-paths-plugin';

/**
 * @type {import('esbuild').BuildOptions}
 */
const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/server.js',
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  external: ['express', 'swagger-ui-express', 'swagger-jsdoc', '@prisma/client'],
  plugins: [tsPathsPlugin()],
};

async function run() {
  if (process.argv.includes('--watch')) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('esbuild: watching and rebuilding on TS changes...');
  } else {
    await esbuild.build(config);
    console.log('esbuild: build completed');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
