/**
 * 错误类型与退出码语义。
 *
 * 退出码是对外契约的一部分，Agent / Shell 可据此分支处理。
 */
import type { EndpointDef } from './types.js';

export const EXIT = {
  /** 成功 */
  OK: 0,
  /** 内部 / 未知错误 */
  INTERNAL: 1,
  /** 用法错误：缺必填参数、参数类型不合法、未知命令 */
  USAGE: 2,
  /** 传输错误：连接失败、超时、非预期 HTTP 状态 */
  TRANSPORT: 3,
  /** 服务端业务错误：HTTP 2xx 但 code !== 0 */
  API: 4,
  /** 鉴权失败：HTTP 401 / 403 */
  AUTH: 5,
} as const;

export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

export class SiyuanError extends Error {
  readonly exitCode: ExitCode;
  readonly detail: Record<string, unknown>;

  constructor(message: string, exitCode: ExitCode, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = new.target.name;
    this.exitCode = exitCode;
    this.detail = detail;
    // 保证 instanceof 在 CJS 编译到 ES2022 时依旧正确
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UsageError extends SiyuanError {
  constructor(message: string, detail: Record<string, unknown> = {}) {
    super(message, EXIT.USAGE, detail);
  }
}

export class TransportError extends SiyuanError {
  constructor(message: string, detail: Record<string, unknown> = {}) {
    super(message, EXIT.TRANSPORT, detail);
  }
}

export class ApiError extends SiyuanError {
  constructor(message: string, detail: Record<string, unknown> = {}) {
    super(message, EXIT.API, detail);
  }
}

export class AuthError extends SiyuanError {
  constructor(message: string, detail: Record<string, unknown> = {}) {
    super(message, EXIT.AUTH, detail);
  }
}

/** 把任意异常归一成 { message, exitCode, detail } */
export function normalizeError(err: unknown): {
  message: string;
  exitCode: ExitCode;
  detail: Record<string, unknown>;
} {
  if (err instanceof SiyuanError) {
    return { message: err.message, exitCode: err.exitCode, detail: err.detail };
  }
  if (err instanceof Error) {
    return { message: err.message, exitCode: EXIT.INTERNAL, detail: { name: err.name } };
  }
  return { message: String(err), exitCode: EXIT.INTERNAL, detail: {} };
}

/** 打印结构化错误到 stderr，并返回退出码 */
export function reportError(
  err: unknown,
  def: EndpointDef | null,
  opts: { raw?: boolean; pretty?: boolean } = {},
): number {
  const { message, exitCode, detail } = normalizeError(err);
  const payload = {
    error: true,
    command: def ? def.cmd.join(' ') : null,
    endpoint: def ? def.api : null,
    exitCode,
    message,
    ...detail,
  };
  const text = opts.raw ? JSON.stringify(payload) : JSON.stringify(payload, null, 2);
  process.stderr.write(text + '\n');
  return exitCode;
}
