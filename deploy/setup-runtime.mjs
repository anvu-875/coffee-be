import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import external from './external-deps.mjs';

const runtimePackageJson = {
  scripts: {
    start: 'node dist/index.js'
  }
};

const rootPath = path.resolve(process.cwd(), '..');
const outputPath = path.resolve(rootPath, 'package.json');
console.log('→ Writing minimal runtime package.json...');
fs.writeFileSync(outputPath, JSON.stringify(runtimePackageJson, null, 2));

console.log('→ Installing runtime dependencies...');
execSync(`npm install ${external.join(' ')} --no-save --no-audit`, {
  stdio: 'inherit'
});

console.log('✅ Runtime setup complete.');
