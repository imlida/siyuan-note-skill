---
name: siyuan-note-cli
description: 通过 @aigood/siyuan-note-cli（siyuan）命令行工具读写思源笔记（SiYuan）。当用户需要搜索/创建/更新/删除思源笔记的笔记本、文档、块、块属性，执行 SQL 查询，上传资源或导入导出文件，操作数据库（属性视图），发送通知，或把思源当作数据库/知识库后端来读写时使用。关键词：思源、SiYuan、siyuan、笔记 API、块 ID、笔记本 ID。
version: 0.1.0
license: MIT
---

# 思源笔记 CLI（siyuan-note-cli）

把思源笔记的全部 80 个 HTTP API 封装成子命令。所有命令由同一份注册表生成，本文命令与 CLI 实现严格一致。

- 完整对照表：`docs/API-MAPPING.md`（命令 ↔ 接口 ↔ 文档章节）
- 逐命令示例：`docs/EXAMPLES.md`
- 上游文档：<https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md>

## 适用场景与触发时机

**用这个 skill 当：**

- 要在思源里找内容（关键词搜索、SQL 查询、按路径/ID 定位）
- 要写内容（建文档、插入/更新/删除块、改块属性）
- 要搬内容（导出 Markdown / zip、上传资源、读写工作空间文件）
- 要操作数据库（属性视图）：渲染视图、增删字段、改单元格、筛选排序
- 要驱动思源做副作用（推通知、渲染模板、跑 Pandoc）
- 把思源当作「带全文检索的文档数据库」来用

**不要用：**

- 需要 UI 交互才能完成的事（思源桌面端的图形设置、插件市场）
- 需要长连接会话的WebSocket 广播订阅（本 CLI 只做正向代理，不做事件订阅）
- 文档明确归为内部实现的 `/api/index`、`/api/transactions`

## 前置条件

1. 思源已启动且**开启 API 鉴权 token**（设置 - 鉴权 - API token）。
2. 安装 CLI：`npm i -g @aigood/siyuan-note-cli`（或 `npx @aigood/siyuan-note-cli ...`）。命令名 `siyuan` 与 `siyuan-note-cli` 等价。
3. 配置连接（优先级：命令行 > 环境变量 > 配置文件 > 默认 `http://127.0.0.1:6806`）：

```bash
export SIYUAN_API_URL=http://127.0.0.1:6806
export SIYUAN_TOKEN=<你的 token>
```

或用配置文件 `~/.siyuan-cli.json`：

```json
{ "apiUrl": "http://127.0.0.1:6806", "token": "<你的 token>", "timeout": 30000 }
```

确认生效：`siyuan config show`（token 脱敏显示）。探活：`siyuan system version`（该接口无需鉴权）。

## 通用调用约定

**输出**：默认格式化 JSON；`--raw` 紧凑单行（喂 `jq`）；`--field <点路径>` 只取字段（如 `--field content`、`--field rows.0.id`）；`--envelope` 输出完整 `{code,msg,data}`；`--out <path>` 写文件；`--pretty` 强制格式化。

**安全网**：不确定请求体长什么样时先加 `--dry-run`，只打印将要发送的请求。

**退出码**（据此判断失败类型并决定重试/改参/报鉴权）：

| 码 | 含义 | 处理 |
| --- | --- | --- |
| 0 | 成功 | — |
| 2 | 用法错误（缺参数 / 枚举非法 / 未知命令） | 补参数，看 `--help` |
| 3 | 传输错误（连不上 / 超时 / 非预期 HTTP） | 检查 `--api-url`、服务是否起来 |
| 4 | 服务端业务错误（HTTP 2xx 但 `code≠0`） | 读 `msg`，多为 ID 不存在或参数不合法 |
| 5 | 鉴权失败（401/403） | 检查 `--token` |

错误信息是结构化 JSON，含 `command`、`endpoint`、`httpStatus`、`code`、`msg`。

**参数类型**：`--attrs` / `--conf` / `--srcs` / `--data` / `--value` / `--group` 等对象数组参数传 JSON 字符串（注意用单引号包裹）；`--paths` / `--source-ids` / `--ref-ids` / `--src-ids` / `--excludes` / `--from-ids` / `--from-paths` 可重复传入；`--file` 可重复传多个文件；`--markdown` / `--data` / `--stmt` / `--template` / `--payload` 支持 `@文件路径` 和 `@-`（读 stdin）。

**注意**：HTTP 超时是 `--http-timeout`；接口自带的 `--timeout`（如 `notify push`）是发给服务端的参数，两者不同。

## 命令清单

### notebook（笔记本，9）

```
siyuan notebook ls
siyuan notebook open    --notebook <notebookID>
siyuan notebook close   --notebook <notebookID>
siyuan notebook rename  --notebook <notebookID> --name <新名称>
siyuan notebook create  --name <名称>
siyuan notebook remove  --notebook <notebookID>
siyuan notebook get-conf --notebook <notebookID>
siyuan notebook set-conf --notebook <notebookID> --conf '<JSON>'
siyuan notebook reorder --source-ids <id> --target-id <id> --position before|after
```

### doc（文档，14）

```
siyuan doc create        --notebook <notebookID> --path /a/b --markdown '<MD>'
siyuan doc rename        --notebook <notebookID> --path /a/b --title <新标题>
siyuan doc rename-by-id  --id <docID> --title <新标题>
siyuan doc remove        --notebook <notebookID> --path /a/b
siyuan doc remove-by-id  --id <docID>
siyuan doc move          --from-paths /a --to-notebook <notebookID> --to-path /b
siyuan doc move-by-id    --from-ids <docID> --to-id <父文档ID或笔记本ID>
siyuan doc reorder       --source-ids <id> --target-id <id> --position before|after
siyuan doc set-sort      --doc-sorts '[{"id":"<docID>","sort":1}]'   # 或 --notebook-sorts，二者至少其一
siyuan doc set-sort-mode --id <docID> --sort-mode 0..14|null
siyuan doc hpath-by-path --notebook <notebookID> --path <存储路径>
siyuan doc hpath-by-id   --id <块ID>                                  # data 是字符串
siyuan doc path-by-id    --id <块ID>                                  # → {notebook, path}
siyuan doc ids-by-hpath  --path <人类可读路径> --notebook <notebookID>
```

### block（块，11）

```
siyuan block insert       --data-type markdown|dom --data '<内容>' \
                            --next-id <id>|--previous-id <id>|--parent-id <id>   # 三者至少其一
siyuan block prepend      --data-type markdown|dom --data '<内容>' --parent-id <id>
siyuan block append       --data-type markdown|dom --data '<内容>' --parent-id <id>
siyuan block update       --data-type markdown|dom --data '<内容>' --id <blockID> [--lock-type]
siyuan block delete       --id <blockID>
siyuan block move         --id <blockID> --previous-id <id>|--parent-id <id>     # 二者至少其一
siyuan block fold         --id <blockID>
siyuan block unfold       --id <blockID>
siyuan block kramdown     --id <blockID>                                  # → {id, kramdown}
siyuan block children     --id <blockID>                                  # → [{id,type,subType,...}]
siyuan block transfer-ref --from-id <定义块ID> --to-id <目标块ID> [--ref-ids <id>]
```

### attr（块属性，2）

```
siyuan attr set --id <blockID> --attrs '{"custom-xxx":"值"}'   # 自定义属性必须 custom- 前缀，值必须是字符串
siyuan attr get --id <blockID>
```

### sql（2）

```
siyuan sql query --stmt 'SELECT id,content FROM blocks LIMIT 20'
siyuan sql flush                                                # 写块后提交事务，保证 SQL 能立刻读到
```

### asset（资源文件，1）

```
siyuan asset upload --assets-dir-path /assets/ --file ./a.png --file ./b.png
# → {succMap:{原文件名:资源路径}, succFiles:[...], errFiles:[...]}
```

### file（工作空间文件，5）

```
siyuan file get     --path /data/x.md [--out ./x.md]
siyuan file put     --path /data/x.md --file ./x.md [--is-dir] [--mod-time <unix秒>]
siyuan file remove  --path /data/x.md
siyuan file rename  --path /a --new-path /b
siyuan file ls      --path /data/templates
```

### template（模板，3）

```
siyuan template render  --id <docID> --path <模板绝对路径> [--mode preview|editorInsert]
siyuan template save-as --id <docID> --name <模板名> [--overwrite] [--database-mode copy|reference]
siyuan template sprig   --template '{{ "hi" | upper }}'
```

### export（导出，2）

```
siyuan export md        --id <docID> [--preserve-task-markers]   # → {hPath, content}
siyuan export resources --paths /data/assets [--name out.zip]     # → {path}
```

### convert（转换，1）

```
siyuan convert pandoc --dir <工作目录名> --args '["--to","markdown_strict-raw_html","a.epub","-o","a.md"]'
```

### notify（通知，2）

```
siyuan notify push --msg '文本' [--timeout 7000]
siyuan notify err  --msg '文本' [--timeout 7000]
```

### network（正向代理，4；后三个为长连接/实验性）

```
siyuan network forward-proxy --url <URL> [--method POST] [--timeout 7000] [--payload '<JSON>'] \
                             [--content-type ...] [--headers '<JSON数组>'] [--redirect] \
                             [--payload-encoding json] [--response-encoding text]
siyuan network proxy  --url <URL> [--method GET] [--body '<原文>'] [--content-type ...] [--headers '<JSON对象>'] [--timeout 30s]
siyuan network ws     --url ws://... [--headers '<JSON对象>'] [--timeout 30s]   # stdin 一行 = 一条消息
siyuan network es     --url http://... [--headers '<JSON对象>'] [--timeout 30s] # SSE 流式输出到 stdout
```

### system（系统，3）

```
siyuan system version        # "3.8.6"，无需鉴权，适合探活
siyuan system boot-progress
siyuan system time
```

### av（数据库 / 属性视图，18）

```
siyuan av render             --id <avID> [--block-id <blockID>] [--view-id <viewID>] [--page 1] [--page-size 50] \
                             [--query <关键字>] [--create-if-not-exist] [--group-paging '<JSON>'] \
                             [--target-item-id <id>] [--target-group-id <id>] [--persist-view]
siyuan av get                --id <avID>
siyuan av images             --id <avID> [--block-id <id>] [--view-id <id>] [--query <关键字>]
siyuan av primary-key-values --id <avID> [--keyword <子串>] [--page 1] [--page-size 16]
siyuan av search             --keyword <关键字> [--excludes <avID>] [--include-view-matches]
siyuan av get-filter-sort    --id <avID> --block-id <blockID>
siyuan av set-context-filter --av-id <avID> --block-id <blockID> --key-id <字段ID|空串禁用>
siyuan av set-cell           --av-id <avID> --key-id <字段ID> --item-id <行ID> --value '<JSON>'
                             # --value 是「部分 Value 对象」，每个类型都要包一层，不能传裸字符串也不能省略 content：
                             #   文本 {"text":{"content":"已归档"}}    数字 {"number":{"content":42,"isNotEmpty":true}}
                             #   单选 {"mSelect":[{"content":"已完成","color":"1"}]}
                             #   日期 {"date":{"content":1676042451000,"isNotEmpty":true}}
                             #   勾选 {"checkbox":{"checked":true}}   链接 {"url":{"content":"https://..."}}
                             #   写错会明确报错而不是静默丢弃：漏 content → exitCode 4
                             #   "cannot unmarshal string into Go struct field AVValue.text of type apicontract.AVValueText"；
                             #   整体不是 JSON → exitCode 2 "--value 不是合法 JSON"。字段 keyType 用 av get 查。
siyuan av add-items          --av-id <avID> --block-id <blockID> --srcs '<JSON数组>' \
                             [--view-id <id>] [--group-id <id>] [--previous-id <id>] [--ignore-default-fill]
siyuan av remove-items       --av-id <avID> --src-ids <行ID> --src-ids <行ID>
siyuan av set-layout         --av-id <avID> --block-id <blockID> --layout-type table|list|gallery|kanban
siyuan av set-group          --av-id <avID> --block-id <blockID> --group '<JSON>'
siyuan av set-filters        --av-id <avID> --block-id <blockID> --data '<ViewFilter数组，整体替换>'
siyuan av set-sorts          --av-id <avID> --block-id <blockID> --data '<ViewSort数组，整体替换>'
siyuan av add-key            --av-id <avID> --key-id <新字段ID> --key-name <名> --key-type text|number|date|select|mSelect|url|email|phone|location|mAsset|template|created|updated|checkbox|relation|rollup|lineNumber \
                             --key-icon <图标> --previous-key-id <字段ID|空串>
                             # 内核把 keyIcon / previousKeyID 当必填：省略会报
                             # "Field [keyIcon] is required" / "Field [previousKeyID] is required"（exitCode 4）。
                             # 首次添加字段就传 --previous-key-id ""（= 排到最前）。keyID 必须是合法节点 ID（14位时间戳-7位字符）。
siyuan av remove-key         --av-id <avID> --key-id <字段ID> [--remove-relation-dest]
siyuan av sort-key           --av-id <avID> --key-id <字段ID> --previous-key-id <字段ID|空串>
siyuan av sort-view-key      --av-id <avID> --key-id <字段ID> --previous-key-id <字段ID|空串> [--view-id <viewID>]
```

### search（已保存搜索条件组，3）

```
siyuan search criteria
siyuan search set-criterion    --criterion '<JSON>'   # 需要管理员角色，只读模式不可用
siyuan search remove-criterion --name <条件组名>
```

### CLI 自身（不对应 API）

```
siyuan api-list [--format table|md|json] [--group <分组>]
siyuan config show
siyuan --help    siyuan <group> --help
```

## 常见任务的标准调用流程

### 1. 搜索内容

```bash
siyuan sql flush    # 若刚刚写过块，先提交事务
siyuan sql query --stmt "SELECT id, hpath, content FROM blocks WHERE content LIKE '%关键词%' LIMIT 20" --raw
```

拿到 `id` 后按需：`siyuan doc hpath-by-id --id <id>` 定位文档，`siyuan block kramdown --id <id>` 取源码。

### 2. 新建文档并写入内容

```bash
DOC=$(siyuan doc create --notebook <nbID> --path /目录/标题 --markdown "$(cat note.md)" --raw)
```

`--path` 以 `/` 开头、对应 `hpath`，不存在的父文档会自动创建；相同 `path` 不会覆盖已有文档，会得到一个新文档。随后用 `block append --parent-id "$DOC"` 继续追加。

### 3. 追加 → 更新 → 删除块

```bash
# 追加，取新块 ID（doOperations[0].id）
NEW=$(siyuan block append --data-type markdown --data "内容" --parent-id <docID> --raw \
      | jq -r '.[0].doOperations[0].id')
siyuan block update --data-type markdown --data "新内容" --id "$NEW"
siyuan block delete --id "$NEW"
```

### 4. 上传资源

```bash
siyuan asset upload --assets-dir-path /assets/ --file ./chart.png --field succMap
```

返回的资源路径（如 `assets/chart-20261016152200-xxxx.png`）可直接写进 Markdown 的 `![](...)`。

### 5. 导出文档

```bash
siyuan export md --id <docID> --field content --out ./out.md
```

### 6. 操作数据库（属性视图）

先用 `av search --keyword <名>` 或 SQL 找到 `avID` 与嵌入它的 `blockID`，再 `av render` 拿 `rows[].id`（= `itemID`），最后改单元格 / 增删条目。

**ID 格式**：所有 av 相关 ID（`avID` / `keyID` / `itemID`）都必须是**合法节点 ID**——14 位时间戳 + `-` + **7 位**小写字母数字（如 `20240118120204-abc1234`）。位数不对不会被当成"不存在"，而是先报 `invalid id` / `invalid attribute view id`，容易误判成别的问题。

**建库顺序**（每步都可能因缺参失败）：

```bash
# 1. 建库并拿到 avID（不存在会创建）
siyuan av render --id <avID> --block-id <数据库块ID> --create-if-not-exist --raw

# 2. 加字段：keyIcon / previousKeyID 内核要求必传，首次用空串
siyuan av add-key --av-id <avID> --key-id <keyID> --key-name "状态" --key-type text \
  --key-icon "1F4A9" --previous-key-id ""

# 3. 加条目（srcs 的 id 也要合法节点 ID）
siyuan av add-items --av-id <avID> --block-id <数据库块ID> \
  --srcs '[{"id":"<itemID>","isDetached":false,"content":"第一条"}]'

# 4. 写单元格：value 必须按 keyType 包一层 content
siyuan av set-cell --av-id <avID> --key-id <keyID> --item-id <itemID> \
  --value '{"text":{"content":"已归档"}}'

# 5. 读回验证
siyuan av render --id <avID> --block-id <数据库块ID> --raw
```

## 错误排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `exitCode 5`，`HTTP 401` / `Auth failed [session]` | token 错或未传 | `siyuan config show` 确认来源；重新设置 `SIYUAN_TOKEN` |
| `exitCode 3`，`ECONNREFUSED` | 地址错或服务未启动 | 核对 `--api-url`；思源需在设置里允许网络访问 |
| `exitCode 3`，`请求超时` | 大查询 / 服务忙 | 加大 `--http-timeout` |
| `exitCode 4`，`msg=... not found` | ID 不存在或已被删除 | 重新查询 ID |
| `exitCode 4`，`cannot unmarshal number into Go value of type string` | `attr set` 的属性值传了数字 | 全部改成字符串 |
| `exitCode 4`，`attribute view not found` | `avID` 不对，或 `render` 默认会创建 | 加 `--create-if-not-exist false` 排查 |
| `exitCode 4`，`not found executable pandoc` | 服务端没装 Pandoc | 安装 Pandoc 或跳过 |
| `exitCode 4`，`cannot unmarshal string into Go struct field AVValue.<类型> of type apicontract.AVValue<类型>` | `av set-cell` 的 `--value` 漏了内层 `content`（如传 `{"text":"x"}` 而非 `{"text":{"content":"x"}}`） | 按值类型表补上 `content` 层 |
| `exitCode 4`，`Field [keyIcon] is required` | `av add-key` 未传图标 | 补 `--key-icon`（如 `1F4A9`） |
| `exitCode 4`，`document can not be folded` | 对文档块调用了 `block fold/unfold` | 换成标题块 / 列表块 |
| `exitCode 2`，`缺少必填参数：--x, --y` | 参数缺失 | 一次性补齐列出的参数 |
| `exitCode 2`，`--value 不是合法 JSON` | `av set-cell` 的 `--value` 传了裸字符串 | 改成合法 JSON 字符串并用单引号包裹 |
| `exitCode 2`，`Invalid values: Argument: data-type` | 枚举值非法 | 用 `--help` 看可选值 |
| SQL 查不到刚写入的内容 | 索引未完成 | 先执行 `siyuan sql flush` |
| 发布模式下 `sql query` 被拒 | 该接口在发布模式禁止访问 | 换用其它接口 |

## 可直接复用的示例

以下均在思源 3.8.6 实机验证过，`<...>` 需替换。

### 示例 1：SQL 搜索内容并定位文档

```bash
export SIYUAN_API_URL=http://127.0.0.1:6806 SIYUAN_TOKEN=<token>

siyuan sql query --stmt "SELECT id,type,content FROM blocks LIMIT 3" --raw
# [{"content":"A Fresh Start","id":"20261016011715-o8rrepi","type":"d"}, ...]

ID=20261016011715-o8rrepi
siyuan doc hpath-by-id --id "$ID"      # /A Fresh Start
siyuan doc path-by-id  --id "$ID"      # {"path":"/20261016011715-o8rrepi.sy","notebook":"..."}
```

### 示例 2：创建文档 → 追加块 → 更新 → 删除

```bash
DOC=$(siyuan doc create --notebook <notebookID> --path "/cli-demo" \
      --markdown "# 标题

hello" --raw)
# 20261016152121-j036qyr

NEW=$(siyuan block append --data-type markdown --data "这是 CLI 插入的块" --parent-id "$DOC" --raw \
      | jq -r '.[0].doOperations[0].id')

siyuan block kramdown --id "$NEW" --field kramdown
# 这是 CLI 插入的块
# {: id="20261016152134-5n0xb44" updated="20261016152134"}

siyuan block update --data-type markdown --data "这是被 CLI 更新过的块" --id "$NEW" >/dev/null
siyuan block children --id "$DOC" --raw
# [{"id":"...","type":"h","subType":"h1","content":"标题"},{"id":"...","content":"hello"},{"id":"...","content":"这是被 CLI 更新过的块"}]

siyuan block delete --id "$NEW" >/dev/null
```

### 示例 3：块属性读写 + 导出 Markdown

```bash
siyuan attr set --id "$NEW" --attrs '{"custom-cli":"smoke"}'
siyuan attr get --id "$NEW"
# {"custom-cli":"smoke","id":"20261016152134-5n0xb44","updated":"20261016152134"}

siyuan export md --id "$DOC" --raw
# {"hPath":"/cli-demo","content":"---\ntitle: cli-demo\n...\n\n# 标题\n\nhello\n"}
```

### 示例 4：上传资源 + 文件读写

```bash
siyuan asset upload --assets-dir-path /assets/ --file ./chart.png
# {"errFiles":null,"failedFiles":[],
#  "succFiles":[{"index":0,"name":"chart.png","path":"assets/chart-20261016152200-6l5r6v6.png"}],
#  "succMap":{"chart.png":"assets/chart-20261016152200-6l5r6v6.png"}}

siyuan file put --path /temp/note.txt --file ./note.txt
siyuan file get --path /temp/note.txt      # 原始内容直接输出
siyuan file ls  --path /temp --raw
siyuan file remove --path /temp/note.txt
```

### 示例 5：按路径建文档并挂到指定父文档下

```bash
# 不存在父文档时会自动创建层级
DOC=$(siyuan doc create --notebook <nbID> --path /项目/周报/2026-W42 --markdown "## 本周进展" --raw)

# 把另一个文档移动进来
siyuan doc move-by-id --from-ids <docID> --to-id "$DOC"

# 改标题 / 排序 / 推送通知
siyuan doc rename-by-id --id "$DOC" --title "2026-W42 周报"
siyuan doc set-sort --doc-sorts "[{\"id\":\"$DOC\",\"sort\":9}]"
siyuan notify push --msg "周报已生成" --timeout 5000
```
