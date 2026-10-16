/**
 * 配置解析：命令行 > 环境变量 > 配置文件 > 内置默认值。
 *
 * 默认值来源（优先级从高到低）：
 *  1. --api-url / --token 命令行参数
 *  2. SIYUAN_API_URL / SIYUAN_TOKEN 环境变量
 *  3. 配置文件（JSON）：
 *     - --config <path> 或 SIYUAN_CONFIG 指定的路径
 *     - 当前目录 .siyuan-cli.json / .siyuanrc.json
 *     - ~/.siyuan-cli.json
 *     - ~/.config/siyuan-cli/config.json
 *  4. 内置默认：http://127.0.0.1:6806，token 为空
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { UsageError } from './errors.js';
import type { ResolvedConfig } from './types.js';

export const DEFAULT_API_URL = 'http://127.0.0.1:6806';
export const DEFAULT_TIMEOUT = 30_000;

interface ConfigFileShape {
  apiUrl?: unknown;
  token?: unknown;
  timeout?: unknown;
  /** 兼容别名 */
  url?: unknown;
  apiURL?: unknown;
}

function readJsonFile(file: string): ConfigFileShape | null {
  try {
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf8').trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as ConfigFileShape;
  } catch {
    return null;
  }
}

/** 候选人目录顺序 */
function configCandidates(cwd = process.cwd()): string[] {
  const home = os.homedir();
  return [
    path.join(cwd, '.siyuan-cli.json'),
    path.join(cwd, '.siyuanrc.json'),
    path.join(home, '.siyuan-cli.json'),
    path.join(home, '.config', 'siyuan-cli', 'config.json'),
  ];
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

export interface CliOverrides {
  apiUrl?: unknown;
  token?: unknown;
  config?: unknown;
  /** HTTP 请求超时（毫秒）。注意与接口自带的 --timeout 参数区分，故命名为 httpTimeout */
  httpTimeout?: unknown;
}

export function loadConfig(argv: CliOverrides): ResolvedConfig {
  const explicit =
    pickString(argv.config) ?? pickString(process.env.SIYUAN_CONFIG) ?? undefined;

  let configFile: string | undefined;
  let fileCfg: ConfigFileShape | null = null;

  if (explicit) {
    const p = path.resolve(explicit);
    if (!fs.existsSync(p)) {
      throw new UsageError(`配置文件不存在：${p}`, { configFile: p });
    }
    fileCfg = readJsonFile(p);
    if (!fileCfg) {
      throw new UsageError(`配置文件不是合法 JSON：${p}`, { configFile: p });
    }
    configFile = p;
  } else {
    for (const candidate of configCandidates()) {
      const parsed = readJsonFile(candidate);
      if (parsed) {
        fileCfg = parsed;
        configFile = candidate;
        break;
      }
    }
  }
  fileCfg = fileCfg ?? {};

  const envUrl = pickString(process.env.SIYUAN_API_URL, process.env.SIYUAN_URL);
  const envToken = pickString(process.env.SIYUAN_TOKEN, process.env.SIYUAN_API_TOKEN);

  const apiUrl =
    pickString(argv.apiUrl) ??
    envUrl ??
    pickString(fileCfg.apiUrl, fileCfg.apiURL, fileCfg.url) ??
    DEFAULT_API_URL;

  const token = pickString(argv.token) ?? envToken ?? pickString(fileCfg.token) ?? '';

  const timeoutRaw =
    pickString(argv.httpTimeout) ??
    pickString(process.env.SIYUAN_HTTP_TIMEOUT) ??
    pickString(fileCfg.timeout);
  const timeout = timeoutRaw ? Number(timeoutRaw) : DEFAULT_TIMEOUT;
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new UsageError(`--timeout 必须为正数，当前值：${timeoutRaw}`, {
      timeout: timeoutRaw,
    });
  }

  const srcOf = (cli: unknown, env: string | undefined, file: unknown) =>
    cli !== undefined && pickString(cli) !== undefined
      ? 'cli'
      : env !== undefined
        ? 'env'
        : pickString(file) !== undefined
          ? 'config-file'
          : 'default';

  return {
    apiUrl: normalizeApiUrl(apiUrl),
    token,
    timeout,
    source: {
      apiUrl: srcOf(argv.apiUrl, envUrl, fileCfg.apiUrl ?? fileCfg.apiURL ?? fileCfg.url),
      token: token
        ? srcOf(argv.token, envToken, fileCfg.token)
        : 'default',
      configFile,
    },
  };
}

/** 去掉结尾斜杠，并校验协议 */
export function normalizeApiUrl(url: string): string {
  let u = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(u)) {
    // 允许 127.0.0.1:6806 这种简写
    u = `http://${u}`;
  }
  return u;
}
