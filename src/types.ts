/**
 * 声明式接口描述的类型定义。
 *
 * 全部子命令都由 EndpointDef 驱动生成（见 registry.ts），
 * 因此「CLI 命令 ↔ HTTP 接口 ↔ 文档章节」三者天然一一对应，
 * docs/API-MAPPING.md 与 skill/SKILL.md 均从同一份 registry 生成。
 */

/** 参数在请求体中的类型 */
export type ParamType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'json'
  | 'stringArray'
  | 'file';

export interface ParamDef {
  /** 请求体 / 表单中的键名（严格遵循 API 文档） */
  name: string;
  /** CLI 选项名（kebab-case） */
  flag: string;
  type: ParamType;
  /** 是否必填，缺失时报错并退出码 2 */
  required?: boolean;
  /** 选项说明 */
  desc: string;
  /** 枚举约束，不在此列表内直接报用法错误 */
  choices?: string[];
  /** number 类型是否允许显式传入 null（如 sortMode） */
  nullable?: boolean;
  /** 该选项可重复传入，收集为数组 */
  multiple?: boolean;
  /** 字符串值以 @ 开头时从文件读取、@- 读取 stdin */
  fileLike?: boolean;
  /** 仅用于 CLI 语义（如正向代理的转发方法/请求体），不写入请求体或 query */
  cliOnly?: boolean;
  /** 缺省值，未显式传参时写入请求体 */
  default?: unknown;
}

/**
 * 传输方式：
 * - json：JSON 请求体 + JSON 信封响应（绝大多数接口）
 * - multipart：multipart/form-data 上传
 * - raw：响应为原始字节（接口自身仍可能用 202 返回错误信封）
 * - passthrough：响应原样转发，不套 code/msg/data
 */
export type Transport = 'json' | 'multipart' | 'raw' | 'passthrough';

export interface EndpointDef {
  /** 命令路径，如 ['notebook', 'ls'] */
  cmd: string[];
  /** 命令分组（同时也是一级命令名） */
  group: string;
  /** 文档中的章节路径，如 '笔记本 > 列出笔记本' */
  section: string;
  /** API 路径，如 '/api/notebook/lsNotebooks' */
  api: string;
  method: 'POST' | 'GET';
  /** 一句话说明 */
  summary: string;
  params?: ParamDef[];
  transport?: Transport;
  /** 长连接类接口 */
  stream?: 'ws' | 'sse';
  /** 这些参数至少要有一个存在 */
  requireAny?: string[];
  /** 文档标注为实验性 / CLI 侧为流式长连接 */
  experimental?: boolean;
  /** 补充说明 */
  notes?: string;
}

/** 思源统一响应信封 */
export interface SiyuanEnvelope {
  code: number;
  msg: string;
  data: unknown;
  limit?: number;
  truncated?: boolean;
  [k: string]: unknown;
}

export interface ResolvedConfig {
  apiUrl: string;
  token: string;
  /** HTTP 超时（毫秒） */
  timeout: number;
  /** 配置来源说明，用于 --verbose */
  source: {
    apiUrl: string;
    token: string;
    configFile?: string;
  };
}
