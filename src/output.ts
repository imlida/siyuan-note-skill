/**
 * 输出层：默认格式化 JSON，支持 --pretty / --raw / --out / --field / --envelope。
 *
 * 规则：
 *  - 默认：对象/数组 → 2 空格缩进 JSON；字符串 → 原样输出（不带引号）；Buffer → 原样字节
 *  - --pretty：一律 2 空格缩进 JSON，字符串带引号
 *  - --raw：一律紧凑单行 JSON（字符串仍原样输出），适合管道
 *  - --field a.b.0.c：只取 data 中的某个字段，取不到报用法错误
 *  - --envelope：输出完整 { code, msg, data, ... } 信封
 */
import fs from 'node:fs';
import path from 'node:path';
import { UsageError } from './errors.js';
import type { SiyuanEnvelope } from './types.js';

export interface OutputOptions {
  pretty?: boolean;
  raw?: boolean;
  out?: string;
  field?: string;
  envelope?: boolean;
}

/** 按点路径取值，支持数组下标 */
export function pickField(value: unknown, field: string): unknown {
  if (field === '' || field === '.') return value;
  let cur: unknown = value;
  const segs = field.split('.').filter((s) => s.length > 0);
  for (const seg of segs) {
    if (cur === null || cur === undefined) {
      throw new UsageError(`--field ${field} 取值失败：路径 ${seg} 之前为 ${String(cur)}`, {
        field,
        failedAt: seg,
      });
    }
    if (Array.isArray(cur)) {
      if (!/^\d+$/.test(seg)) {
        throw new UsageError(`--field ${field} 取值失败：${seg} 不是合法数组下标`, {
          field,
          failedAt: seg,
        });
      }
      cur = cur[Number(seg)];
      continue;
    }
    if (typeof cur !== 'object') {
      throw new UsageError(`--field ${field} 取值失败：${seg} 之前不是对象`, {
        field,
        failedAt: seg,
      });
    }
    const rec = cur as Record<string, unknown>;
    if (!(seg in rec)) {
      throw new UsageError(`--field ${field} 取值失败：字段 ${seg} 不存在`, {
        field,
        failedAt: seg,
        available: Object.keys(rec).slice(0, 20),
      });
    }
    cur = rec[seg];
  }
  return cur;
}

function stringify(value: unknown, opts: OutputOptions): string {
  if (typeof value === 'string' && !opts.pretty) return value;
  if (value === undefined) return '';
  if (opts.raw) return JSON.stringify(value);
  return JSON.stringify(value, null, 2);
}

export function emit(envelope: SiyuanEnvelope, opts: OutputOptions): void {
  let value: unknown = opts.envelope ? envelope : envelope.data;
  if (opts.field) value = pickField(value, opts.field);

  if (Buffer.isBuffer(value)) {
    write(Buffer.from(value), opts);
    return;
  }
  const text = stringify(value, opts);
  write(Buffer.from(text, 'utf8'), opts);
}

function write(buf: Buffer, opts: OutputOptions): void {
  if (opts.out) {
    const p = path.resolve(opts.out);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, buf);
    return;
  }
  // 二进制内容直接写 stdout，其余追加换行以便管道消费
  const isBinaryFriendly = buf.length > 0 && buf.includes(0);
  process.stdout.write(buf);
  if (!isBinaryFriendly && buf.length > 0 && buf[buf.length - 1] !== 0x0a) {
    process.stdout.write('\n');
  }
}

/** 供 --dry-run 等场景打印任意对象 */
export function emitPlain(value: unknown, opts: OutputOptions): void {
  const text = opts.raw ? JSON.stringify(value) : JSON.stringify(value, null, 2);
  process.stdout.write(text + '\n');
}
