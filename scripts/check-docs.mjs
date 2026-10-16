#!/usr/bin/env node
/**
 * 校验 README.md / SKILL.md 中出现的命令与参数是否与 src/registry.ts 一致。
 * 防止文档与实现漂移：任何 `siyuan <group> <cmd>` 或 `--flag` 拼错都会被报出来。
 *
 * 用法：npm run build && npm run check-docs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { ENDPOINTS } = require(path.join(root, 'dist', 'registry.js'));

const GLOBAL_FLAGS = new Set([
  'api-url',
  'token',
  'config',
  'http-timeout',
  'pretty',
  'raw',
  'out',
  'field',
  'envelope',
  'dry-run',
  'verbose',
  'help',
  'version',
]);

const LOCAL_COMMANDS = new Set(['api-list', 'config', 'config show']);
const LOCAL_FLAGS = new Set(['format', 'group']);

const defByCmd = new Map();
for (const e of ENDPOINTS) {
  defByCmd.set(e.cmd.join(' '), {
    api: e.api,
    flags: new Set((e.params ?? []).map((p) => p.flag)),
  });
}

const files = ['README.md', path.join('skill', 'siyuan-note-cli', 'SKILL.md')];
let problems = 0;
let checkedCmds = 0;

for (const rel of files) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  // 先把以 \ 结尾的续行合并
  const merged = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined && /\\\s*$/.test(prev)) {
      merged[merged.length - 1] = prev.replace(/\\\s*$/, ' ') + line.trim();
    } else {
      merged.push(line);
    }
  }

  merged.forEach((line, i) => {
    // 只匹配作为命令出现的 siyuan / siyuan-note-cli：
    // 前面不能是 / @ 字母数字或 -，避免把 `@aigood/siyuan-note-cli` 这类包名误判成命令
    const m = /(?<![/@\w-])siyuan(?:-note-cli)?\s+([a-z][a-z0-9-]*)(?:\s+([a-z][a-z0-9-]*))?/g;
    let hit;
    while ((hit = m.exec(line)) !== null) {
      const group = hit[1];
      const sub = hit[2];
      if (!sub) {
        // 只有一级命令（如 siyuan notebook --help / siyuan --help）
        if (!defByCmd.has(group + ' x') && !LOCAL_COMMANDS.has(group)) {
          // 不是已知的一级命令
          const knownGroups = new Set(ENDPOINTS.map((e) => e.cmd[0]));
          if (!knownGroups.has(group)) {
            console.log(`  ⚠ ${rel}:${i + 1} 未知一级命令 "${group}"`);
            problems++;
          }
        }
        continue;
      }
      const cmd = `${group} ${sub}`;
      if (LOCAL_COMMANDS.has(cmd)) continue;
      const def = defByCmd.get(cmd);
      if (!def) {
        console.log(`  ✗ ${rel}:${i + 1} 命令不存在：${cmd}`);
        problems++;
        continue;
      }
      checkedCmds++;
      // 校验该行（含续行）上的参数；先去掉引号内的内容（如 pandoc 的 --to、JSON 字符串）
      const bare = line.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
      const flags = [...bare.matchAll(/--([a-z0-9][a-z0-9-]*)/g)].map((x) => x[1]);
      for (const f of flags) {
        if (GLOBAL_FLAGS.has(f) || LOCAL_FLAGS.has(f)) continue;
        if (!def.flags.has(f)) {
          // 可能是别的命令的参数混在同一行（如 jq -r），只报同命令行的
          console.log(`  ✗ ${rel}:${i + 1} ${cmd} 无参数 --${f}`);
          problems++;
        }
      }
    }
  });
}

console.log(
  `\ncheck-docs: 校验命令引用 ${checkedCmds} 处，问题 ${problems} 个（文件：${files.join(', ')}）`,
);
if (problems > 0) process.exit(1);
