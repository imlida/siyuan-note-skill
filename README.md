# @aigood/siyuan-note-cli

思源笔记（SiYuan）API 的命令行客户端。把 [官方 API 文档](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md) 中的**全部 80 个接口**逐个实现为子命令，面向脚本与 Agent 调用设计：结构化输出、明确的退出码、可注入的鉴权配置。

```bash
npx @aigood/siyuan-note-cli notebook ls
```

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
git clone <repo> && cd siyuan-cli
npm install && npm run build
node dist/index.js notebook ls
```

> Node.js ≥ 18.17（依赖内置 `fetch`）。

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

## 自动发布

仓库配置了两个 GitHub Actions 工作流：

| 工作流 | 触发时机 | 作用 |
| --- | --- | --- |
| `.github/workflows/ci.yml` | push / PR 到 main | Node 20 + 22 双版本跑 `npm run verify`：编译、生成对照表与示例、校验文档与实现一致，并检查 `docs/` 无漂移 |
| `.github/workflows/publish.yml` | push 到 main 且改动了 `src/` `scripts/` `package.json` `package-lock.json` `tsconfig.json` `README.md`；也可手动触发 | 构建 → 定版本 → `npm publish` → 回写版本号并打 tag |

**版本号规则**（由 `scripts/ci-version.mjs` 决定）：

- `auto`（push 默认）：若 `package.json` 里的版本在 npm 上已存在，自动递增 patch 再发布；否则原样发布。
- `patch` / `minor` / `major`：手动触发时强制递增。
- `none`：绝不改版本号，版本已存在则本次跳过发布。

发布成功后会把 `package.json` + `package-lock.json` 的版本变更提交回 main 并打 `vX.Y.Z` tag（用 `GITHUB_TOKEN` 推送，不会再次触发工作流，因此不会循环）。

### 首次启用

#### 1. 生成 npm token

登录 <https://www.npmjs.com> → 右上角头像 → **Access Tokens** → **Generate New Token**，按下面填：

| 项 | 填什么 | 为什么 |
| --- | --- | --- |
| Token name | `siyuan-note-cli-gh-actions` | 便于以后辨认与吊销 |
| **Bypass two-factor authentication** | ✅ 勾上 | CI 里没法交互输 OTP，不勾发布会失败 |
| **Packages and scopes → Permissions** | **Read and write (publish and stage)** | 选 `stage only` 只会暂存、不会真正发布 |
| Packages and scopes → Select packages | `Only select packages and scopes` → 选 `@aigood` | 最小权限，只给这一个 scope |
| **Allowed IP Ranges** | **留空** | GitHub Actions 的出口 IP 是动态的，填了必失败 |
| Expiration | 选最长的（或 Custom） | 过期后发布会 401，记得提前轮换 |

点 **Generate Token** 后**立刻复制**——完整 token 只在这一次显示，之后只能看到首尾各 4 位。

> 若你的 npm 用户名本身就是 `aigood`，scope 直接可用；不是的话先到
> <https://www.npmjs.com/org/create> 建一个名为 `aigood` 的免费 org，再回来生成 token。

#### 2. 配到 GitHub

```bash
gh secret set NPM_TOKEN -b '<刚才复制的 token>'
gh secret list          # 确认 NPM_TOKEN 已出现
```

`NPM_TOKEN` 未配置时，发布工作流会直接失败并在日志里给出上述命令，不会静默跳过。

#### 3. 触发首次发布

```bash
gh workflow run publish.yml -f bump=patch
gh run watch            # 看实时日志
npm view @aigood/siyuan-note-cli version   # 发布成功后验证
```

包名是 scoped 包 `@aigood/siyuan-note-cli`，`publishConfig.access` 已设为 `public`，install 时用：

```bash
npm i -g @aigood/siyuan-note-cli
```

> **首次发布 scoped 包的前提**：npm 要求 scope 对应一个你所属的 org。若 `npm publish` 报
> `404 Scope not found` 或 `403 You do not have permission to publish "@aigood/..."`，
> 先到 <https://www.npmjs.com/org/create> 建一个名为 `aigood` 的免费 org（把 token 所属账号加进去），
> 之后即可正常发布。

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
