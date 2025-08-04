import fs from 'fs';
import { execSync } from 'child_process';

// 1. Clean all except dist, prisma, swagger-docs.json
const keep = new Set(['dist', 'prisma', 'swagger-docs.json']);

fs.readdirSync('.').forEach((item) => {
  if (keep.has(item)) return;
  if (fs.lstatSync(item).isDirectory()) {
    fs.rmSync(item, { recursive: true, force: true });
  } else {
    fs.unlinkSync(item);
  }
});

console.log('✅ Cleaned project, keeping dist/, prisma/, swagger-docs.json');

// 2. Write new package.json
const runtimePackageJson = {
  name: 'sbe-runtime',
  version: '1.0.0',
  main: 'dist/index.js',
  scripts: {
    start: 'SET NODE_ENV=production&& node dist/index.js'
  }
};

fs.writeFileSync('package.json', JSON.stringify(runtimePackageJson, null, 2));

console.log('✅ Created minimal package.json for runtime');
