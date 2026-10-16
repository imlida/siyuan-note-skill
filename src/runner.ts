/**
 * 命令执行层：参数构造、必填校验、按传输方式分发请求。
 */
import fs from 'node:fs';
import readline from 'node:readline';
import WebSocket from 'ws';
import { SiyuanClient } from './client.js';
import { loadConfig } from './config.js';
import { UsageError } from './errors.js';
import { emit, emitPlain } from './output.js';
import type { EndpointDef, ParamDef } from './types.js';

export interface GlobalArgv {
  apiUrl?: string;
  token?: string;
  config?: string;
  /** HTTP 请求超时（毫秒），与接口自带的 --timeout 参数区分 */
  httpTimeout?: number;
  pretty?: boolean;
  raw?: boolean;
  out?: string;
  field?: string;
  envelope?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  [k: string]: unknown;
}

function readStdinSync(): string {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/** 处理 @file / @- 语法 */
function resolveFileLike(flag: string, value: string): string {
  if (!value.startsWith('@')) return value;
  const rest = value.slice(1);
  if (rest === '-') return readStdinSync();
  const p = rest.replace(/^~/, process.env.HOME ?? '');
  if (!fs.existsSync(p)) {
    throw new UsageError(`--${flag} 引用的文件不存在：${p}`, { flag, file: p });
  }
  return fs.readFileSync(p, 'utf8');
}

function parseJsonParam(flag: string, value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new UsageError(`--${flag} 不是合法 JSON：${(err as Error).message}`, {
      flag,
      value: value.slice(0, 200),
    });
  }
}

function parseNumberParam(flag: string, value: string): number | null {
  if (value.trim() === 'null') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new UsageError(`--${flag} 必须是数字或 null，当前值：${value}`, { flag, value });
  }
  return n;
}

function isPresent(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return true; // 空串也可能是合法取值（如禁用筛选）
  return true;
}

/** 把 argv 中单个参数的原始值转成请求体里的值 */
function coerce(def: ParamDef, raw: unknown): unknown {
  switch (def.type) {
    case 'string': {
      const v = String(raw);
      return def.fileLike ? resolveFileLike(def.flag, v) : v;
    }
    case 'number': {
      if (def.nullable) return parseNumberParam(def.flag, String(raw));
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        throw new UsageError(`--${def.flag} 必须是数字，当前值：${String(raw)}`, {
          flag: def.flag,
          value: raw,
        });
      }
      return n;
    }
    case 'boolean':
      return Boolean(raw);
    case 'json': {
      const v = typeof raw === 'string' ? raw : String(raw);
      if (def.fileLike) {
        const text = resolveFileLike(def.flag, v);
        try {
          return JSON.parse(text);
        } catch {
          // payload 允许是原始字符串
          return text;
        }
      }
      return parseJsonParam(def.flag, v);
    }
    case 'stringArray': {
      if (Array.isArray(raw)) return raw.map((x) => String(x));
      return raw === undefined ? [] : [String(raw)];
    }
    case 'file':
      return raw;
    default:
      return raw;
  }
}

export interface BuiltRequest {
  body: Record<string, unknown>;
  /** multipart 普通字段 */
  fields: Array<{ name: string; value: string }>;
  /** multipart 文件字段 */
  files: Array<{ name: string; path: string }>;
}

export function buildRequest(def: EndpointDef, argv: GlobalArgv): BuiltRequest {
  const params = def.params ?? [];
  const body: Record<string, unknown> = {};
  const fields: Array<{ name: string; value: string }> = [];
  const files: Array<{ name: string; path: string }> = [];

  const missing: string[] = [];

  for (const p of params) {
    const raw = argv[p.flag];
    if (raw === undefined) {
      if (p.required) missing.push(`--${p.flag}`);
      if (p.default !== undefined) {
        body[p.name] = p.default;
        if (def.transport === 'multipart') {
          fields.push({ name: p.name, value: String(p.default) });
        }
      }
      continue;
    }

    if (p.choices && !p.choices.includes(String(raw))) {
      throw new UsageError(`--${p.flag} 取值必须是 ${p.choices.join(' | ')}，当前值：${String(raw)}`, {
        flag: p.flag,
        value: String(raw),
        choices: p.choices,
      });
    }

    if (p.type === 'file') {
      const list = (Array.isArray(raw) ? raw : [raw]).map((x) => String(x));
      for (const f of list) files.push({ name: p.name, path: f });
      continue;
    }

    const value = coerce(p, raw);

    if (def.transport === 'multipart') {
      if (value === null || value === undefined) continue;
      if (typeof value === 'object') {
        fields.push({ name: p.name, value: JSON.stringify(value) });
      } else {
        fields.push({ name: p.name, value: String(value) });
      }
      continue;
    }

    if (p.cliOnly) continue; // 仅 CLI 语义，不进请求体
    body[p.name] = value;
  }

  if (missing.length > 0) {
    throw new UsageError(
      `${def.cmd.join(' ')} 缺少必填参数：${missing.join(', ')}`,
      { endpoint: def.api, missing },
    );
  }

  if (def.requireAny && def.requireAny.length > 0) {
    const satisfied = def.requireAny.some((name) => {
      const p = params.find((x) => x.name === name);
      if (!p) return false;
      if (p.type === 'file') return files.some((f) => f.name === p.name);
      return isPresent(body[name]);
    });
    if (!satisfied) {
      const flags = def.requireAny.map((n) => {
        const p = params.find((x) => x.name === n);
        return `--${p ? p.flag : n}`;
      });
      throw new UsageError(
        `${def.cmd.join(' ')} 需要在 ${flags.join(' / ')} 中至少提供一个`,
        { endpoint: def.api, requireAny: flags },
      );
    }
  }

  return { body, fields, files };
}

function b64url(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url');
}

/** 网络代理类接口的 query：u / h / t */
function buildProxyQuery(def: EndpointDef, argv: GlobalArgv): Record<string, string> {
  const q: Record<string, string> = {};
  const url = argv['url'];
  if (url === undefined) {
    throw new UsageError(`${def.cmd.join(' ')} 缺少必填参数：--url`, { endpoint: def.api });
  }
  q.u = b64url(String(url));
  const headers = argv['headers'];
  if (headers !== undefined) {
    const parsed = parseJsonParam('headers', String(headers));
    q.h = b64url(JSON.stringify(parsed));
  }
  const timeout = argv['timeout'];
  if (timeout !== undefined) q.t = String(timeout);
  return q;
}

export async function runEndpoint(def: EndpointDef, argv: GlobalArgv): Promise<number> {
  const cfg = loadConfig(argv);

  if (argv.verbose) {
    process.stderr.write(
      `[config] api-url=${cfg.apiUrl} (${cfg.source.apiUrl}) token=${cfg.token ? '***' : '(空)'} (${cfg.source.token})` +
        `${cfg.source.configFile ? ` file=${cfg.source.configFile}` : ''}\n`,
    );
  }

  const isProxy = def.stream === 'ws' || def.stream === 'sse' || def.transport === 'passthrough';
  const request = isProxy ? null : buildRequest(def, argv);
  const query = isProxy ? buildProxyQuery(def, argv) : undefined;

  if (argv.dryRun) {
    emitPlain(
      {
        command: def.cmd.join(' '),
        endpoint: def.api,
        method: def.method,
        transport: def.transport ?? 'json',
        apiUrl: cfg.apiUrl,
        ...(query ? { query } : { body: request?.body, fields: request?.fields, files: request?.files }),
      },
      argv,
    );
    return 0;
  }

  const client = new SiyuanClient(cfg);

  // ── WebSocket 正向代理 ──
  if (def.stream === 'ws') {
    return runWsProxy(def, cfg, query!, argv);
  }
  // ── EventSource 正向代理 ──
  if (def.stream === 'sse') {
    const { status } = await client.streamSse(def, query!);
    if (argv.verbose) process.stderr.write(`[sse] HTTP ${status}，流已结束\n`);
    return 0;
  }
  // ── HTTP 正向代理（原样转发） ──
  if (def.transport === 'passthrough') {
    const method = String(argv['method'] ?? 'GET').toUpperCase();
    const bodyText = argv['body'] === undefined ? undefined : String(argv['body']);
    const contentType = argv['contentType'] === undefined ? undefined : String(argv['contentType']);
    const { envelope, status } = await client.callPassthrough(
      def,
      method,
      query!,
      bodyText,
      contentType,
    );
    if (argv.verbose) process.stderr.write(`[proxy] HTTP ${status}\n`);
    if (argv.out) {
      emit(envelope, { out: argv.out });
    } else {
      process.stdout.write(Buffer.isBuffer(envelope.data) ? envelope.data : String(envelope.data));
      process.stdout.write('\n');
    }
    return 0;
  }

  // ── 常规接口 ──
  let result: { envelope: import('./types.js').SiyuanEnvelope; status: number };
  switch (def.transport) {
    case 'multipart':
      result = await client.callMultipart(def, request!.fields, request!.files);
      break;
    case 'raw':
      result = await client.callRaw(def, request!.body);
      break;
    default:
      result = await client.callJson(def, request!.body);
      break;
  }

  emit(result.envelope, argv);
  return 0;
}

async function runWsProxy(
  def: EndpointDef,
  cfg: { apiUrl: string; token: string },
  query: Record<string, string>,
  argv: GlobalArgv,
): Promise<number> {
  const base = cfg.apiUrl.replace(/\/+$/, '');
  const wsBase = base.replace(/^http/, 'ws');
  const url = new URL(wsBase + def.api);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);

  const headers: Record<string, string> = cfg.token ? { Authorization: `Token ${cfg.token}` } : {};
  const ws = new WebSocket(url.toString(), { headers });

  if (argv.verbose) process.stderr.write(`[ws] connecting ${url.toString()}\n`);

  return new Promise<number>((resolve) => {
    let finished = false;
    const done = (code: number) => {
      if (finished) return;
      finished = true;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve(code);
    };

    ws.on('unexpected-response', (_req, res) => {
      process.stderr.write(`[ws] 握手失败 HTTP ${res.statusCode}\n`);
      done(3);
    });
    ws.on('error', (err) => {
      process.stderr.write(`[ws] ${err.message}\n`);
      done(3);
    });
    ws.on('open', () => {
      if (argv.verbose) process.stderr.write('[ws] 已连接，stdin 每行作为一条消息\n');
      const rl = readline.createInterface({ input: process.stdin, terminal: false });
      rl.on('line', (line) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(line);
      });
      rl.on('close', () => {
        /* stdin 结束后保持连接，直到对端关闭 */
      });
    });
    ws.on('message', (data) => {
      const text = typeof data === 'string' ? data : data.toString('utf8');
      process.stdout.write(text + '\n');
    });
    ws.on('close', () => {
      if (argv.verbose) process.stderr.write('[ws] 连接已关闭\n');
      done(0);
    });
    process.on('SIGINT', () => done(0));
  });
}
