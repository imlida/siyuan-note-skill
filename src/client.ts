/**
 * HTTP 统一封装：鉴权头、超时、multipart、原始字节、流式代理。
 *
 * 所有接口都走这里，保证错误语义一致：
 *  - 连接失败 / 超时 / 非预期状态码 → TransportError（退出码 3）
 *  - HTTP 401/403                    → AuthError（退出码 5）
 *  - HTTP 2xx 但 code !== 0          → ApiError（退出码 4）
 */
import fs from 'node:fs';
import path from 'node:path';
import { ApiError, AuthError, TransportError } from './errors.js';
import type { EndpointDef, ResolvedConfig, SiyuanEnvelope } from './types.js';

export interface CallResult {
  envelope: SiyuanEnvelope;
  status: number;
}

export class SiyuanClient {
  constructor(private readonly cfg: ResolvedConfig) {}

  private buildUrl(api: string, query?: Record<string, string>): string {
    const base = this.cfg.apiUrl.replace(/\/+$/, '');
    const p = api.startsWith('/') ? api : `/${api}`;
    const url = new URL(base + p);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== '') url.searchParams.set(k, v);
      }
    }
    return url.toString();
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { ...extra };
    // 文档规定：Authorization: Token xxx
    if (this.cfg.token) h['Authorization'] = `Token ${this.cfg.token}`;
    return h;
  }

  private async fetchWithTimeout(url: string, init: RequestInit, apiLabel?: string): Promise<Response> {
    const label = apiLabel ?? url;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.cfg.timeout);
    try {
      return await fetch(url, { ...init, signal: ctrl.signal, redirect: 'follow' });
    } catch (err) {
      const e = err as Error & { cause?: { code?: string } };
      if (e.name === 'AbortError') {
        throw new TransportError(`请求超时（${this.cfg.timeout}ms）：${url}`, {
          endpoint: label,
          url,
          timeout: this.cfg.timeout,
        });
      }
      const cause = e.cause?.code ?? '';
      throw new TransportError(`无法连接到思源服务：${url}（${e.message}${cause ? ' / ' + cause : ''}）`, {
        endpoint: label,
        url,
        cause: cause || e.message,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /** 解析 {code,msg,data} 信封，code !== 0 时抛错 */
  private assertEnvelope(json: unknown, api: string, status: number): SiyuanEnvelope {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new TransportError(`响应不是合法信封对象：${api}`, { endpoint: api, httpStatus: status });
    }
    const env = json as SiyuanEnvelope;
    if (typeof env.code !== 'number') {
      throw new TransportError(`响应缺少 code 字段：${api}`, { endpoint: api, httpStatus: status });
    }
    if (env.code !== 0) {
      const isAuth = /auth|token|unauthor|forbidden|权限|鉴权/i.test(env.msg ?? '');
      const message = `${api}：服务端返回 code=${env.code}${env.msg ? `，msg=${env.msg}` : ''}`;
      const detail = { endpoint: api, httpStatus: status, code: env.code, msg: env.msg ?? '' };
      throw isAuth ? new AuthError(message, detail) : new ApiError(message, detail);
    }
    return env;
  }

  /** JSON 接口 */
  async callJson(def: EndpointDef, body: Record<string, unknown>): Promise<CallResult> {
    const url = this.buildUrl(def.api);
    const res = await this.fetchWithTimeout(
      url,
      {
        method: def.method,
        headers: this.headers({ 'Content-Type': 'application/json' }),
        body: def.method === 'GET' ? undefined : JSON.stringify(body),
      },
      def.api,
    );
    const text = await res.text();
    this.assertHttp(res.status, def.api, text);

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new TransportError(`响应不是合法 JSON：${def.api}`, {
        endpoint: def.api,
        httpStatus: res.status,
        body: text.slice(0, 500),
      });
    }
    return { envelope: this.assertEnvelope(json, def.api, res.status), status: res.status };
  }

  /** multipart 上传（asset/upload、file/putFile） */
  async callMultipart(
    def: EndpointDef,
    fields: Array<{ name: string; value: string }>,
    files: Array<{ name: string; path: string }>,
  ): Promise<CallResult> {
    const form = new FormData();
    for (const f of fields) form.append(f.name, f.value);
    for (const f of files) {
      const abs = path.resolve(f.path);
      if (!fs.existsSync(abs)) {
        throw new TransportError(`待上传文件不存在：${abs}`, { file: abs });
      }
      const buf = fs.readFileSync(abs);
      const blob = new Blob([buf], { type: 'application/octet-stream' });
      form.append(f.name, blob, path.basename(abs));
    }
    const url = this.buildUrl(def.api);
    const res = await this.fetchWithTimeout(url, { method: def.method, headers: this.headers(), body: form }, def.api);
    const text = await res.text();
    this.assertHttp(res.status, def.api, text);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new TransportError(`响应不是合法 JSON：${def.api}`, {
        endpoint: def.api,
        httpStatus: res.status,
        body: text.slice(0, 500),
      });
    }
    return { envelope: this.assertEnvelope(json, def.api, res.status), status: res.status };
  }

  /** 原始字节响应（file/getFile）。status 202 时按错误信封处理 */
  async callRaw(def: EndpointDef, body: Record<string, unknown>): Promise<CallResult> {
    const url = this.buildUrl(def.api);
    const res = await this.fetchWithTimeout(
      url,
      {
        method: def.method,
        headers: this.headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      },
      def.api,
    );
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.status === 202) {
      const text = buf.toString('utf8');
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new TransportError(`响应不是合法 JSON：${def.api}`, {
          endpoint: def.api,
          httpStatus: res.status,
          body: text.slice(0, 500),
        });
      }
      const env = json as SiyuanEnvelope;
      const codeMsg: Record<number, string> = {
        [-1]: '参数错误',
        403: '无权限',
        404: '未找到',
        405: '是目录',
        500: '服务器错误',
      };
      throw new ApiError(
        `${def.api}：${codeMsg[env.code] ?? '失败'}（code=${env.code}${env.msg ? `，msg=${env.msg}` : ''}）`,
        { endpoint: def.api, httpStatus: res.status, code: env.code, msg: env.msg ?? '' },
      );
    }
    if (res.status < 200 || res.status >= 300) {
      throw new TransportError(`${def.api}：HTTP ${res.status}`, {
        endpoint: def.api,
        httpStatus: res.status,
        body: buf.toString('utf8').slice(0, 500),
      });
    }
    return {
      status: res.status,
      envelope: { code: 0, msg: '', data: buf },
    };
  }

  /** 正向代理：原样转发，不套信封 */
  async callPassthrough(
    def: EndpointDef,
    method: string,
    query: Record<string, string>,
    bodyText: string | undefined,
    contentType?: string,
  ): Promise<CallResult> {
    const url = this.buildUrl(def.api, query);
    const headers = this.headers();
    if (contentType) headers['Content-Type'] = contentType;
    const res = await this.fetchWithTimeout(url, { method, headers, body: bodyText }, def.api);
    const buf = Buffer.from(await res.arrayBuffer());
    return { status: res.status, envelope: { code: 0, msg: '', data: buf } };
  }

  /** EventSource 正向代理：流式输出到 stdout */
  async streamSse(
    def: EndpointDef,
    query: Record<string, string>,
  ): Promise<{ status: number }> {
    const url = this.buildUrl(def.api, query);
    const res = await this.fetchWithTimeout(
      url,
      { method: 'GET', headers: this.headers({ Accept: 'text/event-stream' }) },
      def.api,
    );
    if (!res.body) {
      throw new TransportError(`流式代理没有响应体：${def.api}`, { endpoint: def.api });
    }
    const reader = (res.body as unknown as { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }> } }).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) process.stdout.write(Buffer.from(value));
    }
    return { status: res.status };
  }

  private assertHttp(status: number, api: string, text: string): void {
    if (status === 401 || status === 403) {
      throw new AuthError(`${api}：鉴权失败（HTTP ${status}），请检查 --token 是否正确`, {
        endpoint: api,
        httpStatus: status,
        body: text.slice(0, 500),
      });
    }
    if (status < 200 || status >= 300) {
      throw new TransportError(`${api}：HTTP ${status}`, {
        endpoint: api,
        httpStatus: status,
        body: text.slice(0, 500),
      });
    }
  }
}
