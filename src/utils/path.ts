import path from 'node:path';

const rootDir = process.cwd();
const mainDir = path.resolve(rootDir, 'src');
const publicDir = path.resolve(rootDir, 'public');

export default { mainDir, rootDir, publicDir, ...path };
