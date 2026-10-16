/**
 * 由 registry 生成 yargs 命令树。
 * 每条 EndpointDef → 一个子命令，参数选项 → yargs option，必填/枚举在 runner 里校验。
 */
import type { Argv } from 'yargs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { EXIT, reportError } from './errors.js';
import { loadConfig } from './config.js';
import { ENDPOINTS, GROUPS, docUrlOf } from './registry.js';
import { runEndpoint, type GlobalArgv } from './runner.js';
import type { EndpointDef, ParamDef } from './types.js';

const pkg = require('../package.json') as { version: string };

function describeParam(p: ParamDef): string {
  const parts: string[] = [];
  if (p.required) parts.push('[必填]');
  parts.push(p.desc);
  if (p.choices) parts.push(`可选值: ${p.choices.join(' | ')}`);
  if (p.nullable) parts.push('可传 null');
  if (p.multiple) parts.push('可重复传入');
  if (p.fileLike) parts.push('支持 @文件路径 / @- 读 stdin');
  if (p.cliOnly) parts.push('(仅 CLI 语义，不进入请求)');
  return parts.join(' ');
}

function applyOptions(y: Argv, def: EndpointDef): Argv {
  for (const p of def.params ?? []) {
    const desc = describeParam(p);
    switch (p.type) {
      case 'string':
        y = y.option(p.flag, {
          type: 'string',
          describe: desc,
          ...(p.choices ? { choices: p.choices } : {}),
        });
        break;
      case 'number':
        // nullable 数字用 string 接收，交由 runner 解析（支持显式 "null"）
        y = y.option(p.flag, p.nullable ? { type: 'string', describe: desc } : { type: 'number', describe: desc });
        break;
      case 'boolean':
        y = y.option(p.flag, { type: 'boolean', describe: desc });
        break;
      case 'json':
        y = y.option(p.flag, { type: 'string', describe: desc });
        break;
      case 'stringArray':
        y = y.option(p.flag, { type: 'array', string: true, describe: desc });
        break;
      case 'file':
        y = y.option(p.flag, { type: 'array', string: true, describe: desc });
        break;
    }
  }
  return y;
}

export function buildCli(argv: string[]): Argv {
  let y = yargs(argv)
    .scriptName('siyuan')
    .usage(
      '$0 <group> <command> [options]\n\n思源笔记 API 命令行工具。全部子命令与 https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md 一一对应。',
    )
    .option('api-url', {
      type: 'string',
      describe: '思源服务地址，默认 http://127.0.0.1:6806',
      global: true,
    })
    .option('token', {
      type: 'string',
      describe: 'API token（设置 - 鉴权 - API token）',
      global: true,
    })
    .option('config', { type: 'string', describe: '指定配置文件路径（JSON）', global: true })
    .option('http-timeout', {
      type: 'number',
      describe: 'HTTP 请求超时（毫秒），默认 30000',
      global: true,
    })
    .option('pretty', {
      type: 'boolean',
      describe: '强制格式化输出（对象 2 空格缩进，字符串带引号）',
      global: true,
    })
    .option('raw', {
      type: 'boolean',
      describe: '紧凑单行输出，适合管道；字符串仍原样输出',
      global: true,
    })
    .option('out', { type: 'string', describe: '把结果写入文件而非 stdout', global: true })
    .option('field', {
      type: 'string',
      describe: '只输出 data 中的某个字段，支持点路径与数组下标，如 content / rows.0.id',
      global: true,
    })
    .option('envelope', {
      type: 'boolean',
      describe: '输出完整 { code, msg, data } 信封而非仅 data',
      global: true,
    })
    .option('dry-run', {
      type: 'boolean',
      describe: '只打印将要发送的请求，不实际调用',
      global: true,
    })
    .option('verbose', {
      type: 'boolean',
      describe: '在 stderr 打印配置来源与连接信息',
      global: true,
    })
    .help('help')
    .alias('help', 'h')
    .version(pkg.version)
    .alias('version', 'V')
    .strict()
    .recommendCommands()
    .demandCommand(1, '请指定子命令，或用 `siyuan api-list` 查看全部命令')
    .example('$0 notebook ls', '列出笔记本')
    .example(
      '$0 sql query --stmt "SELECT id,content FROM blocks LIMIT 5"',
      'SQL 查询',
    )
    .example(
      '$0 block insert --data-type markdown --data "新块" --parent-id <docID>',
      '插入块',
    )
    .epilogue(
      `文档：https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md\n退出码：0 成功 / 2 用法错误 / 3 传输错误 / 4 服务端业务错误 / 5 鉴权失败`,
    );

  // 按一级命令分组，用 yargs 嵌套 command 注册（不能直接写 'notebook ls'，
  // 否则第二个裸词会被当成位置参数，导致同组命令互相覆盖）
  const byGroup = new Map<string, EndpointDef[]>();
  for (const def of ENDPOINTS) {
    const key = def.cmd[0];
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(def);
  }

  for (const [groupKey, defs] of byGroup) {
    const title = GROUPS.find((g) => g.key === groupKey)?.title ?? groupKey;
    y = y.command({
      command: groupKey,
      describe: `${title}（${defs.length} 个命令）`,
      builder: (yy: Argv) => {
        let g = yy.usage(`$0 ${groupKey} <command> [options]`);
        for (const def of defs) {
          g = g.command({
            command: def.cmd.slice(1).join(' '),
            describe: `${def.summary}${def.experimental ? '（实验性）' : ''}  →  ${def.api}`,
            builder: (z: Argv) => applyOptions(z, def),
            handler: async (a: unknown) => {
              const argv = a as GlobalArgv;
              try {
                process.exitCode = await runEndpoint(def, argv);
              } catch (err) {
                process.exitCode = reportError(err, def, { raw: argv.raw });
              }
            },
          });
        }
        return g.demandCommand(1, `请指定 ${groupKey} 的子命令，如：${defs[0].cmd.join(' ')}`);
      },
      handler: () => {
        /* 由 demandCommand 兜底，不会走到这里 */
      },
    });
  }

  // ── CLI 自身提供的辅助命令（不对应任何 API） ──
  y = y.command({
    command: 'api-list',
    describe: '打印「命令 ↔ 接口 ↔ 文档章节」对照清单',
    builder: (yy: Argv) =>
      yy
        .option('format', {
          type: 'string',
          describe: '输出格式',
          choices: ['table', 'md', 'json'],
          default: 'table',
        })
        .option('group', {
          type: 'string',
          describe: '只看某个分组',
          choices: GROUPS.map((g) => g.key),
        }),
    handler: (a: unknown) => {
      const argv = a as { format: string; group?: string; raw?: boolean };
      const list = argv.group ? ENDPOINTS.filter((e) => e.group === argv.group) : ENDPOINTS;
      if (argv.format === 'json') {
        process.stdout.write(
          JSON.stringify(
            list.map((e) => ({
              command: e.cmd.join(' '),
              api: e.api,
              method: e.method,
              section: e.section,
              doc: docUrlOf(e.section),
              experimental: Boolean(e.experimental),
            })),
            null,
            2,
          ) + '\n',
        );
        return;
      }
      if (argv.format === 'md') {
        const lines = ['| 命令 | 接口 | 文档章节 |', '| --- | --- | --- |'];
        for (const e of list) {
          lines.push(
            `| \`${e.cmd.join(' ')}\` | \`${e.api}\` | [${e.section}](${docUrlOf(e.section)}) |`,
          );
        }
        process.stdout.write(lines.join('\n') + '\n');
        return;
      }
      const w = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - s.length));
      const cmdW = Math.max(...list.map((e) => e.cmd.join(' ').length));
      const apiW = Math.max(...list.map((e) => e.api.length));
      process.stdout.write(
        `${w('命令', cmdW)}  ${w('接口', apiW)}  文档章节\n` +
          `${'-'.repeat(cmdW)}  ${'-'.repeat(apiW)}  ${'-'.repeat(20)}\n` +
          list
            .map((e) => `${w(e.cmd.join(' '), cmdW)}  ${w(e.api, apiW)}  ${e.section}`)
            .join('\n') +
          '\n',
      );
    },
  });

  y = y.command({
    command: 'config',
    describe: '查看 CLI 自身配置',
    builder: (yy: Argv) =>
      yy
        .usage('$0 config <command>')
        .command({
          command: 'show',
        describe: '打印当前生效的配置（token 脱敏）',
        handler: (a: unknown) => {
          const argv = a as GlobalArgv;
          try {
            const cfg = loadConfig(argv);
            process.stdout.write(
              JSON.stringify(
                {
                  apiUrl: cfg.apiUrl,
                  token: cfg.token ? `${cfg.token.slice(0, 4)}***(${cfg.token.length})` : '',
                  timeout: cfg.timeout,
                  source: cfg.source,
                  env: {
                    SIYUAN_API_URL: process.env.SIYUAN_API_URL ?? null,
                    SIYUAN_TOKEN: process.env.SIYUAN_TOKEN ? '(已设置)' : null,
                    SIYUAN_CONFIG: process.env.SIYUAN_CONFIG ?? null,
                  },
                },
                null,
                2,
              ) + '\n',
            );
            process.exitCode = EXIT.OK;
          } catch (err) {
            process.exitCode = reportError(err, null, { raw: argv.raw });
          }
        },
      })
        .demandCommand(1, '请指定 config 的子命令：config show'),
    handler: () => {
      /* 由 demandCommand 兜底 */
    },
  });

  return y;
}

export function main(): void {
  const y = buildCli(hideBin(process.argv));
  y.fail((msg: string, err: Error) => {
    if (err) {
      process.exitCode = reportError(err, null);
      process.exit(process.exitCode);
    }
    process.stderr.write(`${msg}\n`);
    process.exit(EXIT.USAGE);
  });
  void y.parseAsync().catch((err: unknown) => {
    process.exitCode = reportError(err, null);
  });
}
