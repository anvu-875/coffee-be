import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'fs';
import external from './external-deps.mjs';
import { fileName as swaggerFileName } from './swagger-gen.mjs';

const nodeModules = 'node_modules';

// Ensure the current working directory is set to the deploy directory
// Edit it if necessary
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.chdir(resolve(__dirname, '..'));
// -------------------------------------------------------------------

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

console.log('🔁 Step 0: Install all deps (Development Environment)');
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
// Edit this array below to include all runtime files and directories
const runtimeTmpArr = ['dist', 'prisma', 'public', swaggerFileName];

mkdirSync(tmpDir, { recursive: true });

function moveSafe(from, to) {
  if (existsSync(from)) {
    try {
      renameSync(from, to);
    } catch {}
  }
}

runtimeTmpArr.forEach((item) => {
  moveSafe(item, `${tmpDir}/${item}`);
});

console.log('→ Removing all files except runtime...');
const { readdirSync } = await import('fs');
for (const entry of readdirSync('.', { withFileTypes: true })) {
  if (![tmpDir, nodeModules, 'deploy'].includes(entry.name)) {
    try {
      rmSync(entry.name, { recursive: true, force: true });
    } catch {}
  }
}

console.log(`🗑 Deleting ${nodeModules}...`);

//checking rimraf existence
console.log('→ Checking for rimraf...');
const rimrafIsExisted = existsSync(`./${nodeModules}/.bin/rimraf`);
if (!rimrafIsExisted) {
  console.log('→ rimraf not found, installing it...');
  run('npm install rimraf --no-save --no-audit', '📦 rimraf');
}

try {
  execSync(`rimraf ${nodeModules}`, { stdio: 'inherit' });
} catch (error) {
  console.error(
    `Error occurred while executing command: rimraf ${nodeModules}`
  );
  console.error(error);
}

console.log('→ Restoring runtime folders...');
runtimeTmpArr.forEach((item) => {
  moveSafe(`${tmpDir}/${item}`, item);
});
rmSync(tmpDir, { recursive: true, force: true });

console.log('📦 Step 3: Write runtime package.json + install runtime deps');

const runtimePackageJson = {
  scripts: {
    start: 'node dist/index.js'
  }
};
writeFileSync('package.json', JSON.stringify(runtimePackageJson, null, 2));

console.log('→ Installing runtime dependencies...');
if (external.length > 0) {
  function getDirSize(dir) {
    let total = 0;
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = join(dir, file.name);
      if (file.isDirectory()) {
        total += getDirSize(fullPath);
      } else {
        total += statSync(fullPath).size;
      }
    }
    return total;
  }

  function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
  }

  run(
    `npm install ${external.join(' ')} --no-save --no-audit`,
    `📦 ${external.join(' ')}`
  );

  const size = getDirSize(nodeModules);
  console.log(`📦 ${nodeModules} size: ${formatSize(size)}`);
} else {
  console.log('No external dependencies to install.');
}

console.log('🔧 Step 4: Generate Prisma client');
run('npx prisma generate');

console.log('✅ Build complete. Final structure:');
console.log('📁 Final structure in current directory:');
for (const entry of readdirSync('.', { withFileTypes: true })) {
  if ([...runtimeTmpArr, nodeModules].includes(entry.name)) {
    console.log(' -', entry.name);
  }
}

if (existsSync('deploy')) {
  rmSync('deploy', { recursive: true, force: true });
}
