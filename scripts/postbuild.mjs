#!/usr/bin/env node
/**
 * 构建后处理：确保 dist/index.js 带 shebang 且可执行。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'dist', 'index.js');

if (!fs.existsSync(entry)) {
  console.error(`postbuild: 未找到 ${entry}，请先运行 tsc`);
  process.exit(1);
}

const SHEBANG = '#!/usr/bin/env node';
let content = fs.readFileSync(entry, 'utf8');
if (!content.startsWith(SHEBANG)) {
  content = `${SHEBANG}\n${content}`;
  fs.writeFileSync(entry, content);
}
fs.chmodSync(entry, 0o755);
console.log('postbuild: dist/index.js 已就绪（shebang + 0755）');
