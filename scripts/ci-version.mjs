#!/usr/bin/env node
/**
 * CI 用的版本号决策脚本：决定这次要不要发版、发哪个版本。
 *
 * 输入（环境变量）：
 *   BUMP=auto|patch|minor|major|none   默认 auto
 *     auto  ：若当前 package.json 版本已在 npm 上，则自动递增 patch；否则原样发布
 *     patch / minor / major：强制递增
 *     none  ：绝不改版本号；若版本已存在则本次不发版（publish=false）
 *   GITHUB_OUTPUT：存在时把结果写成 step outputs
 *
 * 输出：name / version / changed / publish / already_published
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const pkgPath = path.resolve('package.json');
const readVersion = () => JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const name = pkg.name;
const bump = (process.env.BUMP || 'auto').toLowerCase();

function existsOnNpm(pkgName, version) {
  if (!/^\d+\.\d+\.\d+/.test(version)) return false;
  try {
    const out = execSync(`npm view "${pkgName}@${version}" version --json`, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
    return String(out).includes(version);
  } catch {
    return false;
  }
}

function inc(version, type) {
  const [maj, min, pat] = version.split('.').map((n) => Number.parseInt(n, 10) || 0);
  if (type === 'major') return `${maj + 1}.0.0`;
  if (type === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

const current = readVersion();
const alreadyPublished = existsOnNpm(name, current);

let target = current;
let publish = true;

if (bump === 'patch' || bump === 'minor' || bump === 'major') {
  target = inc(current, bump);
} else if (bump === 'none') {
  if (alreadyPublished) publish = false;
} else {
  // auto
  if (alreadyPublished) target = inc(current, 'patch');
}

if (target !== current) {
  execSync(`npm version ${target} --no-git-tag-version --allow-same-version`, {
    stdio: 'inherit',
  });
}

const finalVersion = readVersion();
const result = {
  name,
  version: finalVersion,
  changed: String(finalVersion !== current),
  publish: String(publish),
  already_published: String(alreadyPublished),
  bump,
};

const outFile = process.env.GITHUB_OUTPUT;
const lines = Object.entries(result).map(([k, v]) => `${k}=${v}`);
if (outFile) {
  fs.appendFileSync(outFile, lines.join('\n') + '\n');
}
console.log(`[ci-version] ${lines.join(' | ')}`);

if (!publish) {
  console.log(
    `[ci-version] ${name}@${finalVersion} 已存在于 npm，且 BUMP=none，本次跳过发布。` +
      `如需发布请手动改 package.json 版本号，或用 workflow_dispatch 选择 patch/minor/major。`,
  );
}
