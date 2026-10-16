# siyuan-note-skill

思源笔记（SiYuan）API 的命令行客户端 + Agent Skill。把 [官方 API 文档](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md) 中的**全部 80 个接口**逐个实现为子命令，面向脚本与 Agent 调用设计：结构化输出、明确的退出码、可注入的鉴权配置。

配套的 Skill 定义位于 [`skill/siyuan-note-skill/SKILL.md`](skill/siyuan-note-skill/SKILL.md)，可让 AI 助手直接读写你的思源笔记。

```bash
npx @aigood/siyuan-note-cli notebook ls
```

> **关于命名**：本仓库名为 `siyuan-note-skill`；发布到 npm 的包名仍是 [`@aigood/siyuan-note-cli`](https://www.npmjs.com/package/@aigood/siyuan-note-cli)（已发布 0.1.1，改名会破坏既有安装，故保持不变）。下文所有 `npm` / `npx` 命令请继续使用 `@aigood/siyuan-note-cli`。

---

## 自动安装

把下面这段 prompt 整段复制给你正在用的 AI 助手（Claude Code / Cursor / Codex 等），它会自动完成安装与配置。

### 安装前提

开始前请确认这 4 项，缺一项 AI 助手都会卡住：

| # | 前提 | 说明 |
| --- | --- | --- |
| 1 | **Node.js ≥ 18.17** | 依赖内置 `fetch`，用 `node -v` 确认 |
| 2 | **思源笔记已启动** | 默认监听 `http://127.0.0.1:6806` |
| 3 | **已开启 API 鉴权 token** | 思源「设置 - 鉴权 - API token」查看并复制 |
| 4 | **能访问 GitHub 与 npm** | 拉仓库 + 装包 |

> token 属于敏感凭据，请让助手写入 `chmod 600` 的配置文件或环境变量，**不要**写进仓库、README 或聊天记录。

### 可直接复制的 prompt

```text
请帮我安装并配置思源笔记 Skill「siyuan-note-skill」。

仓库：https://github.com/imlida/siyuan-note-skill

请按以下步骤完成，每步都告诉我实际执行的命令和结果：

1. 前置检查
   - 确认 Node.js 版本 ≥ 18.17（node -v），不满足就告诉我并停止
   - 确认思源服务可达：curl http://127.0.0.1:6806/api/system/version

2. 安装 CLI（二选一，优先全局安装）
   - npm install -g @aigood/siyuan-note-cli
   - 若全局安装因权限失败，改用 npx 或 --prefix，不要改动系统目录权限
   安装后命令名为 siyuan，与 siyuan-note-cli 等价

3. 配置鉴权（token 我会提供，若我没给就停下来问我）
   - 优先用环境变量：export SIYUAN_API_URL=http://127.0.0.1:6806 和 export SIYUAN_TOKEN=<token>
   - 或写配置文件 ~/.siyuan-cli.json（权限 chmod 600），这是 CLI 会自动发现的路径
   - 绝对不要把 token 写进仓库文件或提交到 git

4. 安装 Skill
   - 把仓库中的 skill/siyuan-note-skill/ 整个目录复制到你的 skills 目录
   - Skills 目录位置按你的客户端而定：Claude Code 为 ~/.claude/skills/，
     其他客户端请用该客户端的技能目录
   - 复制后确认 SKILL.md 的 frontmatter 里 name: siyuan-note-skill

5. 验证（这三条都必须成功，失败就报告具体原因，不要含糊带过）
   - siyuan system version          # 探活，该接口无需鉴权
   - siyuan config show             # 确认配置生效，token 脱敏显示
   - siyuan notebook ls             # 列出笔记本；返回鉴权错误说明 token 不对

6. 收尾
   - 用一句话总结：CLI 是否装好、Skill 装到哪个目录、配置是否生效
   - 告诉我以后怎么触发这个 skill（例如让我搜索思源笔记内容）

如果任何一步失败，请停下来告诉我失败原因和你的建议，不要自行跳过或假装成功。
```

### 安装后的验证方式

手动验证按顺序跑这三条，全部通过即安装成功：

```bash
# 1. CLI 是否就位（应输出版本号）
siyuan --version

# 2. 服务是否可达（无需鉴权，最适合排查网络/服务未启动）
siyuan system version

# 3. 配置与鉴权是否生效（token 脱敏显示，确认 source 来自 env 或 file）
siyuan config show

# 4. 端到端：能真正读到数据
siyuan notebook ls --field notebooks --raw | jq -r '.[].name'
```

常见失败与对应原因：

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `command not found: siyuan` | 全局安装未生效 | 改用 `npx @aigood/siyuan-note-cli`，或重开终端 |
| 退出码 3 + 连不上服务 | 思源未启动或端口不对 | 确认思源在跑，核对 `SIYUAN_API_URL` |
| 退出码 5 鉴权失败 | token 错误或未开启鉴权 | 回思源设置里重新复制 token |
| 助手说已装好但没反应 | Skill 目录层级不对 | 确认是 `skills/siyuan-note-skill/SKILL.md` 三层结构 |

---

## 特性

- **覆盖完整**：80 个接口 → 80 个子命令，含数据库（属性视图）、正向代理（含 WebSocket / EventSource）等文档标注为实验性的接口。未实现项 **0**（见 [`docs/API-MAPPING.md`](docs/API-MAPPING.md)）。
- **单一事实来源**：所有命令由 `src/registry.ts` 声明式定义，命令 ↔ 接口 ↔ 文档章节三者同源，文档与 skill 均由其生成，不会漂移。
- **参数严格**：必填缺失一次性列出全部缺失项；枚举值非法直接报错；`--dry-run` 可先看请求体再发送。
- **管道友好**：默认格式化 JSON，`--raw` 紧凑单行，`--field` 取字段，二进制可 `--out` 落盘。
- **错误可判定**：错误信息含命令名、接口路径、HTTP 状态码、服务端 `code` 与 `msg`，退出码有明确语义。

## 快速开始

```bash
# 免安装
npx @aigood/siyuan-note-cli system version --api-url http://127.0.0.1:6806

# 全局安装（提供 siyuan 与 siyuan-note-cli 两个命令）
npm install -g @aigood/siyuan-note-cli
siyuan notebook ls

# 本地开发
git clone https://github.com/imlida/siyuan-note-skill.git && cd siyuan-note-skill
npm install && npm run build
node dist/index.js notebook ls
```

> Node.js ≥ 18.17（依赖内置 `fetch`）。
>
> 想让 AI 助手自动装，直接用上面的[「自动安装」](#自动安装)章节里的 prompt。

## 鉴权与配置

在思源「设置 - 鉴权 - API token」拿到 token。优先级从高到低：

| 优先级 | 来源 | 示例 |
| --- | --- | --- |
| 1 | 命令行参数 | `--api-url http://127.0.0.1:6806 --token xxxx` |
| 2 | 环境变量 | `SIYUAN_API_URL` / `SIYUAN_TOKEN` |
| 3 | 配置文件 | `--config ./siyuan.json` 或 `SIYUAN_CONFIG` |
| 4 | 自动发现的配置 | `./.siyuan-cli.json`、`./.siyuanrc.json`、`~/.siyuan-cli.json`、`~/.config/siyuan-cli/config.json` |
| 5 | 内置默认 | `http://127.0.0.1:6806`，token 为空 |

配置文件格式（JSON）：

```json
{
  "apiUrl": "http://127.0.0.1:6806",
  "token": "your-api-token",
  "timeout": 30000
}
```

随时用 `siyuan config show` 确认当前生效值与来源（token 脱敏）：

```bash
$ siyuan config show
{
  "apiUrl": "http://127.0.0.1:6806",
  "token": "abcd***(16)",
  "timeout": 30000,
  "source": { "apiUrl": "env", "token": "env" }
}
```

> token 建议走环境变量或 `chmod 600` 的配置文件，避免写进仓库。

## 输出

| 选项 | 行为 |
| --- | --- |
| （默认） | 对象 / 数组格式化 JSON（2 空格缩进）；字符串原样输出（不带引号）；二进制原样写 stdout |
| `--pretty` | 强制格式化，字符串也带 JSON 引号 |
| `--raw` | 紧凑单行 JSON，适合管道喂给 `jq` |
| `--field <path>` | 只取 `data` 中某字段，支持点路径与数组下标，如 `content`、`rows.0.id` |
| `--envelope` | 输出完整 `{ code, msg, data }` 信封 |
| `--out <path>` | 写入文件而非 stdout |

```bash
siyuan export md --id 20261016152121-j036qyr --field content   # 只要 Markdown 正文
siyuan sql query --stmt "SELECT id FROM blocks LIMIT 5" --raw   # 单行 JSON，便于管道
siyuan file get --path /data/foo.md --out ./foo.md              # 二进制落盘
```

## 退出码

| 码 | 含义 | 典型场景 |
| --- | --- | --- |
| 0 | 成功 | — |
| 1 | 内部 / 未知错误 | 未预期异常 |
| 2 | 用法错误 | 缺必填参数、枚举值非法、未知命令 |
| 3 | 传输错误 | 连不上服务、超时、非预期 HTTP 状态 |
| 4 | 服务端业务错误 | HTTP 2xx 但 `code !== 0` |
| 5 | 鉴权失败 | HTTP 401 / 403，或 `msg` 命中鉴权关键词 |

错误一律写 stderr，格式为结构化 JSON：

```json
{
  "error": true,
  "command": "notebook ls",
  "endpoint": "/api/notebook/lsNotebooks",
  "exitCode": 5,
  "message": "/api/notebook/lsNotebooks：鉴权失败（HTTP 401），请检查 --token 是否正确",
  "httpStatus": 401,
  "body": "{\"code\":-1,\"msg\":\"Auth failed [session]\"}"
}
```

## 全局选项

| 选项 | 说明 |
| --- | --- |
| `--api-url` | 思源服务地址 |
| `--token` | API token |
| `--config <path>` | 指定配置文件 |
| `--http-timeout <ms>` | HTTP 超时，默认 30000（注意：接口自带的 `--timeout` 是发给服务端的参数，两者不同） |
| `--pretty` / `--raw` | 输出格式 |
| `--out <path>` | 结果写文件 |
| `--field <path>` | 取字段 |
| `--envelope` | 输出完整信封 |
| `--dry-run` | 只打印将要发送的请求 |
| `--verbose` | 在 stderr 打印配置来源与连接信息 |
| `-h` / `--help`、`-V` / `--version` | 帮助 / 版本 |

## 命令总览

| 分组 | 命令数 | 说明 |
| --- | --- | --- |
| `notebook` | 9 | 笔记本增删改查、开关、配置、排序 |
| `doc` | 14 | 文档创建/改名/删除/移动/排序、路径与 ID 互查 |
| `block` | 11 | 块插入/更新/删除/移动/折叠、kramdown、子块、引用转移 |
| `attr` | 2 | 块属性读写 |
| `sql` | 2 | SQL 查询、事务提交 |
| `asset` | 1 | 资源文件上传 |
| `file` | 5 | 工作空间文件读写删改名、列目录 |
| `template` | 3 | 模板渲染、文档另存为模板、Sprig |
| `export` | 2 | 导出 Markdown、导出 zip |
| `convert` | 1 | Pandoc |
| `notify` | 2 | 推送消息 / 报错消息 |
| `network` | 4 | JSON / HTTP / WebSocket / EventSource 正向代理 |
| `system` | 3 | 启动进度、版本、当前时间 |
| `av` | 18 | 数据库（属性视图）渲染、字段、条目、筛选排序 |
| `search` | 3 | 已保存搜索条件组的读、存、删 |

完整对照表（命令 ↔ 接口 ↔ 文档章节 ↔ 必填/选填参数）：[`docs/API-MAPPING.md`](docs/API-MAPPING.md)；每个命令的可复制示例：[`docs/EXAMPLES.md`](docs/EXAMPLES.md)。

也可以直接在终端里查：

```bash
siyuan api-list                       # 表格
siyuan api-list --format md           # Markdown 表格
siyuan api-list --group block         # 只看某个分组
siyuan notebook --help                # 某分组下所有子命令与参数
```

## 常用示例

以下示例均已在本机思源 3.8.6 实机验证（`<...>` 为占位）。

```bash
export SIYUAN_API_URL=http://127.0.0.1:6806
export SIYUAN_TOKEN=your-api-token

# 探活：version 接口无需鉴权即可判断服务是否在
siyuan system version

# 列出笔记本，只取名字
siyuan notebook ls --field notebooks --raw | jq -r '.[].name'

# SQL 搜索内容（写块后建议先 flush 再查）
siyuan sql flush
siyuan sql query --stmt "SELECT id, hpath, content FROM blocks WHERE content LIKE '%关键词%' LIMIT 20"

# 用 Markdown 建文档
siyuan doc create --notebook <notebookID> --path /日记/2026-10-16 --markdown "$(cat note.md)"

# 在文档末尾追加块
siyuan block append --data-type markdown --data "新段落" --parent-id <docID> --raw \
  | jq -r '.[0].doOperations[0].id'

# 更新 / 删除块
siyuan block update --data-type markdown --data "改后的内容" --id <blockID>
siyuan block delete --id <blockID>

# 块属性（自定义属性须 custom- 前缀，值必须是字符串）
siyuan attr set --id <blockID> --attrs '{"custom-status":"done"}'
siyuan attr get --id <blockID>

# 上传资源并插入引用
siyuan asset upload --assets-dir-path /assets/ --file ./chart.png

# 导出整篇文档为 Markdown
siyuan export md --id <docID> --field content --out ./out.md

# 推一条桌面通知
siyuan notify push --msg "同步完成" --timeout 5000
```

## 注意事项

- **写后读**：写块接口可能在 SQL 索引完成前返回，随后立刻用 `sql query` 读取请先执行 `siyuan sql flush`。
- **属性类型**：`setBlockAttrs` 的值必须是字符串，传数字会被服务端拒绝（`cannot unmarshal number into Go value of type string`）。
- **非空即合法**：`id`、`path` 等参数的空字符串在某些接口里有语义（如 `av set-context-filter --key-id ""` 表示禁用），CLI 只校验"是否传入"，不校验非空。
- **发布模式**：`/api/query/sql` 在思源发布模式下禁止访问。
- **正向代理**：`network proxy` 为原样转发，上游非 2xx 也照常输出响应体且退出码为 0；`network ws` / `network es` 是长连接命令，需要 Ctrl-C 或对端关闭才结束。

## 开发

```bash
npm install
npm run build        # tsc + 补 shebang + chmod
npm run mapping      # 重新生成 docs/API-MAPPING.md
npm run examples     # 重新生成 docs/EXAMPLES.md
```

新增一个接口只需在 `src/registry.ts` 里加一条 `EndpointDef`，命令、参数校验、帮助文本、对照表、示例会自动生成，无需改动其它文件。

## License

MIT
