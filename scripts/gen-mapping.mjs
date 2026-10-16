#!/usr/bin/env node
/**
 * 从 registry 生成 docs/API-MAPPING.md：命令 ↔ 接口 ↔ 文档章节 对照清单，
 * 并与 docs/api-endpoints.txt（从官方 API 文档提取的端点全集）做差集，标注未实现项。
 *
 * 用法：npm run build && npm run mapping
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const { ENDPOINTS, GROUPS, docUrlOf } = require(path.join(root, 'dist', 'registry.js'));

const docAll = fs
  .readFileSync(path.join(root, 'docs', 'api-endpoints.txt'), 'utf8')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

const implemented = new Set(ENDPOINTS.map((e) => e.api));
const missing = docAll.filter((p) => !implemented.has(p));
const extra = ENDPOINTS.filter((e) => !docAll.includes(e.api));

const esc = (s) => s.replace(/\|/g, '\\|');

const lines = [];
lines.push('# 命令 ↔ 接口 ↔ 文档章节 对照清单');
lines.push('');
lines.push('> 本文件由 `npm run mapping` 从 `src/registry.ts` 自动生成，请勿手工编辑。');
lines.push('> 文档基准：`docs/API.zh-CN.md`（<https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md>）。');
lines.push('');
lines.push(`- 官方文档端点总数：**${docAll.length}**`);
lines.push(`- 已实现命令数：**${ENDPOINTS.length}**`);
lines.push(`- 未实现项：**${missing.length}**`);
lines.push(`- 实验性 / 长连接命令：**${ENDPOINTS.filter((e) => e.experimental).length}**`);
lines.push('');

lines.push('## 未实现项');
lines.push('');
if (missing.length === 0) {
  lines.push('无。文档中列出的全部接口均已实现对应子命令。');
} else {
  lines.push('| 接口 | 状态 |');
  lines.push('| --- | --- |');
  for (const m of missing) lines.push(`| \`${m}\` | 未实现 |`);
}
lines.push('');
lines.push(
  '> 说明：`/api/index` 与 `/api/transactions` 属于文档「行为语义」中明确标注的内部实现，不属公开 API，故不计入。',
);
if (extra.length > 0) {
  lines.push('');
  lines.push('### 不在文档端点清单中的命令');
  lines.push('');
  for (const e of extra) lines.push(`- \`${e.cmd.join(' ')}\` → \`${e.api}\``);
}
lines.push('');

for (const g of GROUPS) {
  const list = ENDPOINTS.filter((e) => e.group === g.key);
  if (list.length === 0) continue;
  lines.push(`## ${g.title}（${list.length}）`);
  lines.push('');
  lines.push('| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const e of list) {
    const req = (e.params ?? []).filter((p) => p.required).map((p) => `--${p.flag}`);
    const opt = (e.params ?? []).filter((p) => !p.required).map((p) => `--${p.flag}`);
    const anyOf = e.requireAny
      ? (() => {
          const flags = e.requireAny.map(
            (n) => `--${(e.params ?? []).find((p) => p.name === n)?.flag ?? n}`,
          );
          return `（${flags.join(' / ')} 至少其一）`;
        })()
      : '';
    const reqCell = req.length ? req.join(' ') + anyOf : anyOf || '—';
    lines.push(
      `| \`${e.cmd.join(' ')}\` | \`${e.api}\` | ${e.method} | [${esc(e.section)}](${docUrlOf(e.section)}) | ${esc(reqCell)} | ${esc(opt.length ? opt.join(' ') : '—')} |`,
    );
  }
  lines.push('');
}

lines.push('## CLI 自身提供的辅助命令（不对应任何 API）');
lines.push('');
lines.push('| 命令 | 说明 |');
lines.push('| --- | --- |');
lines.push('| `api-list [--format table\\|md\\|json] [--group <key>]` | 打印命令 ↔ 接口对照清单 |');
lines.push('| `config show` | 打印当前生效配置（token 脱敏）与来源 |');
lines.push('');

const out = path.join(root, 'docs', 'API-MAPPING.md');
fs.writeFileSync(out, lines.join('\n'));
console.log(`已生成 ${path.relative(root, out)}：${ENDPOINTS.length} 条命令，未实现 ${missing.length} 项`);
if (missing.length) console.log('未实现：', missing.join(', '));
