import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import external from './external-deps.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.chdir(resolve(__dirname, '..'));

function run(cmd, desc) {
  if (desc) {
    console.log(desc);
  }
  try {
    execSync(cmd, {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
  } catch (error) {
    console.error(`Error occurred while executing command: ${cmd}`);
    console.error(error);
  }
}

function safe(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch (error) {
    console.error(`Error occurred while executing command: ${cmd}`);
    console.error(error);
  }
}

console.log('🔁 Step 0: Install all deps');
safe('npm cache clean --force');
try {
  execSync('npm i', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
} catch (error) {
  console.error(`Error occurred while executing command: npm i`);
  console.error(error);
}

console.log('🏗️ Step 1: Build project');
run('npm run build');

console.log('🧹 Step 2: Prune non-runtime files');
safe('npm cache clean --force');

const tmpDir = '.runtime-tmp';
mkdirSync(tmpDir, { recursive: true });

function moveSafe(from, to) {
  if (existsSync(from)) {
    try {
      renameSync(from, to);
    } catch {}
  }
}

moveSafe('dist', `${tmpDir}/dist`);
moveSafe('prisma', `${tmpDir}/prisma`);
moveSafe('public', `${tmpDir}/public`);
moveSafe('swagger-docs.json', `${tmpDir}/swagger-docs.json`);

console.log('→ Removing all files except runtime...');
const { readdirSync } = await import('fs');
for (const entry of readdirSync('.', { withFileTypes: true })) {
  if (!['.runtime-tmp', 'node_modules', 'deploy'].includes(entry.name)) {
    try {
      rmSync(entry.name, { recursive: true, force: true });
    } catch {}
  }
}

console.log('🗑 Deleting node_modules...');
try {
  execSync('rimraf node_modules', { stdio: 'inherit' });
} catch (error) {
  console.error(`Error occurred while executing command: rimraf node_modules`);
  console.error(error);
}

console.log('→ Restoring runtime folders...');
moveSafe(`${tmpDir}/dist`, 'dist');
moveSafe(`${tmpDir}/prisma`, 'prisma');
moveSafe(`${tmpDir}/public`, 'public');
moveSafe(`${tmpDir}/swagger-docs.json`, 'swagger-docs.json');
rmSync(tmpDir, { recursive: true, force: true });

console.log('📦 Step 3: Write runtime package.json + install runtime deps');

const runtimePackageJson = {
  scripts: {
    start: 'node dist/index.js'
  }
};
writeFileSync('package.json', JSON.stringify(runtimePackageJson, null, 2));

console.log('→ Installing runtime dependencies...');
run(
  `npm install ${external.join(' ')} --no-save --no-audit`,
  `📦 ${external.join(' ')}`
);

console.log('🔧 Step 4: Generate Prisma client');
run('npx prisma generate');

console.log('✅ Build complete. Final structure:');
console.log('📁 Final structure in current directory:');
for (const entry of readdirSync('.', { withFileTypes: true })) {
  if (
    [
      'dist',
      'prisma',
      'public',
      'swagger-docs.json',
      'package.json',
      'node_modules'
    ].includes(entry.name)
  ) {
    console.log(' -', entry.name);
  }
}

if (existsSync('deploy')) {
  rmSync('deploy', { recursive: true, force: true });
}
