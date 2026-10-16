#!/usr/bin/env node
/**
 * 从 registry 生成 docs/EXAMPLES.md：为每个命令生成一条可复制的调用示例。
 * 示例与 CLI 实际选项严格同源，避免文档与实现漂移。
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { ENDPOINTS, GROUPS, docUrlOf } = require(path.join(root, 'dist', 'registry.js'));

/** 按参数类型生成占位值 */
function placeholder(p) {
  if (p.choices) return p.choices[0];
  switch (p.type) {
    case 'number':
      return p.nullable ? '3' : '3';
    case 'boolean':
      return null; // 只出现 --flag
    case 'json':
      return `'${jsonHint(p)}'`;
    case 'stringArray':
      return null;
    case 'file':
      return null;
    default:
      return `<${p.flag}>`;
  }
}

function jsonHint(p) {
  const n = p.name.toLowerCase();
  if (n.includes('sorts')) return '[{"id":"<id>","sort":1}]';
  if (n === 'attrs') return '{"custom-foo":"bar"}';
  if (n === 'conf') return '{"name":"<名称>","closed":false}';
  if (n === 'args') return '["--to","markdown_strict-raw_html","foo.epub","-o","foo.md"]';
  if (n === 'headers') return '[]';
  if (n === 'value') return '{"text":{"content":"新值"}}';
  if (n === 'srcs') return '[{"id":"<块ID>","isDetached":false,"content":"条目"}]';
  if (n === 'group') return '{"field":"<字段ID>","valueSource":"stored","method":0}';
  if (n === 'data') return '[]';
  if (n === 'criterion') return '{"name":"我的条件组","k":"关键字"}';
  if (n === 'payload') return '{"key":"value"}';
  if (n === 'grouppaging') return '{}';
  return '{}';
}

function exampleLine(e) {
  const parts = [`siyuan ${e.cmd.join(' ')}`];
  for (const p of e.params ?? []) {
    const ph = placeholder(p);
    if (p.type === 'stringArray' || p.type === 'file') {
      const v = p.type === 'file' ? './file' : p.name.replace(/s$/i, '') || 'item';
      parts.push(`--${p.flag} ${v}1`, `--${p.flag} ${v}2`);
      continue;
    }
    if (ph === null) {
      if (p.required) parts.push(`--${p.flag}`);
      continue;
    }
    parts.push(`--${p.flag} ${ph}`);
  }
  return parts.join(' \\\n    ');
}

const lines = [];
lines.push('# 逐命令调用示例');
lines.push('');
lines.push('> 由 `npm run examples` 从 `src/registry.ts` 自动生成，选项与实现严格一致。');
lines.push('> 占位符 `<xxx>` 需替换为真实 ID / 路径。必填参数全部列出，选填参数以「可选」标注。');
lines.push('');

for (const g of GROUPS) {
  const list = ENDPOINTS.filter((e) => e.group === g.key);
  if (!list.length) continue;
  lines.push(`## ${g.title}`);
  lines.push('');
  for (const e of list) {
    lines.push(`### \`${e.cmd.join(' ')}\``);
    lines.push('');
    lines.push(`${e.summary}`);
    lines.push('');
    lines.push(`- 接口：\`${e.method} ${e.api}\``);
    lines.push(`- 文档：[${e.section}](${docUrlOf(e.section)})`);
    const req = (e.params ?? []).filter((p) => p.required).map((p) => `--${p.flag}`);
    const opt = (e.params ?? []).filter((p) => !p.required).map((p) => `--${p.flag}`);
    if (req.length) lines.push(`- 必填：${req.join(' ')}`);
    if (opt.length) lines.push(`- 选填：${opt.join(' ')}`);
    if (e.requireAny) {
      const flags = e.requireAny.map((n) => `--${(e.params ?? []).find((p) => p.name === n)?.flag ?? n}`);
      lines.push(`- 约束：${flags.join(' / ')} 至少提供一个`);
    }
    if (e.notes) lines.push(`- 注意：${e.notes}`);
    if (e.experimental) lines.push('- 实验性：是');
    lines.push('');
    lines.push('```bash');
    lines.push(exampleLine(e));
    lines.push('```');
    lines.push('');
  }
}

fs.writeFileSync(path.join(root, 'docs', 'EXAMPLES.md'), lines.join('\n'));
console.log(`已生成 docs/EXAMPLES.md：${ENDPOINTS.length} 条示例`);
