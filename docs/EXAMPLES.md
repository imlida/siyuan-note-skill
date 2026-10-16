# 逐命令调用示例

> 由 `npm run examples` 从 `src/registry.ts` 自动生成，选项与实现严格一致。
> 占位符 `<xxx>` 需替换为真实 ID / 路径。必填参数全部列出，选填参数以「可选」标注。

## 笔记本

### `notebook ls`

列出全部笔记本（id / name / icon / sort / closed）

- 接口：`POST /api/notebook/lsNotebooks`
- 文档：[笔记本 > 列出笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#列出笔记本)

```bash
siyuan notebook ls
```

### `notebook open`

打开笔记本

- 接口：`POST /api/notebook/openNotebook`
- 文档：[笔记本 > 打开笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#打开笔记本)
- 必填：--notebook

```bash
siyuan notebook open \
    --notebook <notebook>
```

### `notebook close`

关闭笔记本（校验 ID 时不去除两端空白）

- 接口：`POST /api/notebook/closeNotebook`
- 文档：[笔记本 > 关闭笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#关闭笔记本)
- 必填：--notebook

```bash
siyuan notebook close \
    --notebook <notebook>
```

### `notebook rename`

重命名笔记本

- 接口：`POST /api/notebook/renameNotebook`
- 文档：[笔记本 > 重命名笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#重命名笔记本)
- 必填：--notebook --name

```bash
siyuan notebook rename \
    --notebook <notebook> \
    --name <name>
```

### `notebook create`

创建笔记本，返回 data.notebook

- 接口：`POST /api/notebook/createNotebook`
- 文档：[笔记本 > 创建笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#创建笔记本)
- 必填：--name

```bash
siyuan notebook create \
    --name <name>
```

### `notebook remove`

删除笔记本

- 接口：`POST /api/notebook/removeNotebook`
- 文档：[笔记本 > 删除笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除笔记本)
- 必填：--notebook

```bash
siyuan notebook remove \
    --notebook <notebook>
```

### `notebook get-conf`

获取笔记本配置（box / conf / name）

- 接口：`POST /api/notebook/getNotebookConf`
- 文档：[笔记本 > 获取笔记本配置](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取笔记本配置)
- 必填：--notebook

```bash
siyuan notebook get-conf \
    --notebook <notebook>
```

### `notebook set-conf`

保存笔记本配置，conf 为完整配置对象

- 接口：`POST /api/notebook/setNotebookConf`
- 文档：[笔记本 > 保存笔记本配置](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#保存笔记本配置)
- 必填：--notebook --conf

```bash
siyuan notebook set-conf \
    --notebook <notebook> \
    --conf '{"name":"<名称>","closed":false}'
```

### `notebook reorder`

相对调整笔记本顺序（端点属于 notebook，文档归类于「文档」章节）

- 接口：`POST /api/notebook/reorder`
- 文档：[文档 > 相对调整笔记本顺序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#相对调整笔记本顺序)
- 必填：--source-ids --target-id --position

```bash
siyuan notebook reorder \
    --source-ids sourceID1 \
    --source-ids sourceID2 \
    --target-id <target-id> \
    --position before
```

## 文档

### `doc create`

通过 Markdown 创建文档，返回文档 ID；相同 path 不会覆盖已有文档

- 接口：`POST /api/filetree/createDocWithMd`
- 文档：[文档 > 通过 Markdown 创建文档](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#通过-markdown-创建文档)
- 必填：--notebook --path --markdown

```bash
siyuan doc create \
    --notebook <notebook> \
    --path <path> \
    --markdown <markdown>
```

### `doc rename`

通过路径重命名文档

- 接口：`POST /api/filetree/renameDoc`
- 文档：[文档 > 重命名文档（通过路径）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#重命名文档通过路径)
- 必填：--notebook --path --title

```bash
siyuan doc rename \
    --notebook <notebook> \
    --path <path> \
    --title <title>
```

### `doc rename-by-id`

通过 ID 重命名文档

- 接口：`POST /api/filetree/renameDocByID`
- 文档：[文档 > 重命名文档（通过 ID）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#重命名文档通过-id)
- 必填：--id --title

```bash
siyuan doc rename-by-id \
    --id <id> \
    --title <title>
```

### `doc remove`

通过路径删除文档

- 接口：`POST /api/filetree/removeDoc`
- 文档：[文档 > 删除文档（通过路径）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除文档通过路径)
- 必填：--notebook --path

```bash
siyuan doc remove \
    --notebook <notebook> \
    --path <path>
```

### `doc remove-by-id`

通过 ID 删除文档

- 接口：`POST /api/filetree/removeDocByID`
- 文档：[文档 > 删除文档（通过 ID）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除文档通过-id)
- 必填：--id

```bash
siyuan doc remove-by-id \
    --id <id>
```

### `doc move`

通过路径批量移动文档

- 接口：`POST /api/filetree/moveDocs`
- 文档：[文档 > 移动文档（通过路径）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移动文档通过路径)
- 必填：--from-paths --to-notebook --to-path

```bash
siyuan doc move \
    --from-paths fromPath1 \
    --from-paths fromPath2 \
    --to-notebook <to-notebook> \
    --to-path <to-path>
```

### `doc move-by-id`

通过 ID 批量移动文档

- 接口：`POST /api/filetree/moveDocsByID`
- 文档：[文档 > 移动文档（通过 ID）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移动文档通过-id)
- 必填：--from-ids --to-id

```bash
siyuan doc move-by-id \
    --from-ids fromID1 \
    --from-ids fromID2 \
    --to-id <to-id>
```

### `doc reorder`

相对调整文档顺序，返回 changed / notebook / parentPath

- 接口：`POST /api/filetree/reorderDocs`
- 文档：[文档 > 相对调整文档顺序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#相对调整文档顺序)
- 必填：--source-ids --target-id --position

```bash
siyuan doc reorder \
    --source-ids sourceID1 \
    --source-ids sourceID2 \
    --target-id <target-id> \
    --position before
```

### `doc set-sort`

设置笔记本和文档排序值，两者至少提供一个

- 接口：`POST /api/filetree/setSort`
- 文档：[文档 > 设置笔记本和文档排序值](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置笔记本和文档排序值)
- 选填：--notebook-sorts --doc-sorts
- 约束：--notebook-sorts / --doc-sorts 至少提供一个
- 注意：docSorts 中的文档必须属于已打开且已解锁的笔记本

```bash
siyuan doc set-sort \
    --notebook-sorts '[{"id":"<id>","sort":1}]' \
    --doc-sorts '[{"id":"<id>","sort":1}]'
```

### `doc set-sort-mode`

设置文档的子文档排序方式，0~14 或 null 清除设置

- 接口：`POST /api/filetree/setDocSortMode`
- 文档：[文档 > 设置文档的子文档排序方式](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置文档的子文档排序方式)
- 必填：--id --sort-mode

```bash
siyuan doc set-sort-mode \
    --id <id> \
    --sort-mode 3
```

### `doc hpath-by-path`

根据路径获取人类可读路径（data 为字符串）

- 接口：`POST /api/filetree/getHPathByPath`
- 文档：[文档 > 根据路径获取人类可读路径](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#根据路径获取人类可读路径)
- 必填：--notebook --path

```bash
siyuan doc hpath-by-path \
    --notebook <notebook> \
    --path <path>
```

### `doc hpath-by-id`

根据 ID 获取人类可读路径（data 为字符串）

- 接口：`POST /api/filetree/getHPathByID`
- 文档：[文档 > 根据 ID 获取人类可读路径](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#根据-id-获取人类可读路径)
- 必填：--id

```bash
siyuan doc hpath-by-id \
    --id <id>
```

### `doc path-by-id`

根据 ID 获取存储路径，返回 notebook / path

- 接口：`POST /api/filetree/getPathByID`
- 文档：[文档 > 根据 ID 获取存储路径](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#根据-id-获取存储路径)
- 必填：--id

```bash
siyuan doc path-by-id \
    --id <id>
```

### `doc ids-by-hpath`

根据人类可读路径获取匹配的 ID 数组

- 接口：`POST /api/filetree/getIDsByHPath`
- 文档：[文档 > 根据人类可读路径获取 IDs](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#根据人类可读路径获取-ids)
- 必填：--path --notebook

```bash
siyuan doc ids-by-hpath \
    --path <path> \
    --notebook <notebook>
```

## 块

### `block insert`

插入块；nextID / previousID / parentID 至少提供一个，优先级递减

- 接口：`POST /api/block/insertBlock`
- 文档：[块 > 插入块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#插入块)
- 必填：--data-type --data
- 选填：--next-id --previous-id --parent-id
- 约束：--next-id / --previous-id / --parent-id 至少提供一个

```bash
siyuan block insert \
    --data-type markdown \
    --data <data> \
    --next-id <next-id> \
    --previous-id <previous-id> \
    --parent-id <parent-id>
```

### `block prepend`

在父块最前面插入子块

- 接口：`POST /api/block/prependBlock`
- 文档：[块 > 插入前置子块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#插入前置子块)
- 必填：--data-type --data --parent-id

```bash
siyuan block prepend \
    --data-type markdown \
    --data <data> \
    --parent-id <parent-id>
```

### `block append`

在父块最后面追加子块

- 接口：`POST /api/block/appendBlock`
- 文档：[块 > 插入后置子块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#插入后置子块)
- 必填：--data-type --data --parent-id

```bash
siyuan block append \
    --data-type markdown \
    --data <data> \
    --parent-id <parent-id>
```

### `block update`

更新块内容；lockType 为 true 时，解析后块类型不同则拒绝更新

- 接口：`POST /api/block/updateBlock`
- 文档：[块 > 更新块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#更新块)
- 必填：--data-type --data --id
- 选填：--lock-type

```bash
siyuan block update \
    --data-type markdown \
    --data <data> \
    --id <id>
```

### `block delete`

删除块

- 接口：`POST /api/block/deleteBlock`
- 文档：[块 > 删除块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除块)
- 必填：--id

```bash
siyuan block delete \
    --id <id>
```

### `block move`

移动块；previousID 与 parentID 不能同时为空，previousID 优先

- 接口：`POST /api/block/moveBlock`
- 文档：[块 > 移动块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移动块)
- 必填：--id
- 选填：--previous-id --parent-id
- 约束：--previous-id / --parent-id 至少提供一个

```bash
siyuan block move \
    --id <id> \
    --previous-id <previous-id> \
    --parent-id <parent-id>
```

### `block fold`

折叠块

- 接口：`POST /api/block/foldBlock`
- 文档：[块 > 折叠块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#折叠块)
- 必填：--id

```bash
siyuan block fold \
    --id <id>
```

### `block unfold`

展开块

- 接口：`POST /api/block/unfoldBlock`
- 文档：[块 > 展开块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#展开块)
- 必填：--id

```bash
siyuan block unfold \
    --id <id>
```

### `block kramdown`

获取块 kramdown 源码，返回 id / kramdown

- 接口：`POST /api/block/getBlockKramdown`
- 文档：[块 > 获取块 kramdown 源码](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取块-kramdown-源码)
- 必填：--id

```bash
siyuan block kramdown \
    --id <id>
```

### `block children`

获取子块（标题下方块也算子块）

- 接口：`POST /api/block/getChildBlocks`
- 文档：[块 > 获取子块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取子块)
- 必填：--id

```bash
siyuan block children \
    --id <id>
```

### `block transfer-ref`

把指向 fromID 的引用转移到 toID

- 接口：`POST /api/block/transferBlockRef`
- 文档：[块 > 转移块引用](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#转移块引用)
- 必填：--from-id --to-id
- 选填：--ref-ids

```bash
siyuan block transfer-ref \
    --from-id <from-id> \
    --to-id <to-id> \
    --ref-ids refID1 \
    --ref-ids refID2
```

## 属性

### `attr set`

设置块属性；自定义属性必须以 custom- 为前缀

- 接口：`POST /api/attr/setBlockAttrs`
- 文档：[属性 > 设置块属性](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置块属性)
- 必填：--id --attrs

```bash
siyuan attr set \
    --id <id> \
    --attrs '{"custom-foo":"bar"}'
```

### `attr get`

获取块属性（含内置属性 id / title / type / updated 等）

- 接口：`POST /api/attr/getBlockAttrs`
- 文档：[属性 > 获取块属性](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取块属性)
- 必填：--id

```bash
siyuan attr get \
    --id <id>
```

## SQL

### `sql query`

执行 SQL 查询，返回行数组；发布模式下禁止访问

- 接口：`POST /api/query/sql`
- 文档：[SQL > 执行 SQL 查询](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#执行-sql-查询)
- 必填：--stmt
- 注意：写块后如需立即读取，先执行 sql flush 提交事务

```bash
siyuan sql query \
    --stmt <stmt>
```

### `sql flush`

提交事务，确保 SQL 索引完成后可被 /api/query/sql 立即读到

- 接口：`POST /api/sqlite/flushTransaction`
- 文档：[SQL > 提交事务](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#提交事务)

```bash
siyuan sql flush
```

## 资源文件

### `asset upload`

上传资源文件，返回 succMap / succFiles / errFiles

- 接口：`POST /api/asset/upload`
- 文档：[资源文件 > 上传资源文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#上传资源文件)
- 必填：--assets-dir-path
- 选填：--file
- 约束：--file 至少提供一个

```bash
siyuan asset upload \
    --assets-dir-path <assets-dir-path> \
    --file ./file1 \
    --file ./file2
```

## 文件

### `file get`

获取文件内容（原始字节，建议配合 --out 保存）

- 接口：`POST /api/file/getFile`
- 文档：[文件 > 获取文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取文件)
- 必填：--path
- 注意：HTTP 202 表示失败：code -1 参数错误 / 403 无权限 / 404 未找到 / 405 是目录 / 500 服务器错误

```bash
siyuan file get \
    --path <path>
```

### `file put`

写入文件；isDir 为 true 时仅创建文件夹

- 接口：`POST /api/file/putFile`
- 文档：[文件 > 写入文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#写入文件)
- 必填：--path
- 选填：--is-dir --mod-time --file

```bash
siyuan file put \
    --path <path> \
    --mod-time 3 \
    --file ./file1 \
    --file ./file2
```

### `file remove`

删除文件

- 接口：`POST /api/file/removeFile`
- 文档：[文件 > 删除文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除文件)
- 必填：--path

```bash
siyuan file remove \
    --path <path>
```

### `file rename`

重命名文件

- 接口：`POST /api/file/renameFile`
- 文档：[文件 > 重命名文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#重命名文件)
- 必填：--path --new-path

```bash
siyuan file rename \
    --path <path> \
    --new-path <new-path>
```

### `file ls`

列出文件夹内容（isDir / isSymlink / name / updated）

- 接口：`POST /api/file/readDir`
- 文档：[文件 > 列出文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#列出文件)
- 必填：--path

```bash
siyuan file ls \
    --path <path>
```

## 模板

### `template render`

渲染模板，返回 content / path / docTreePlan

- 接口：`POST /api/template/render`
- 文档：[模板 > 渲染模板](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#渲染模板)
- 必填：--id --path
- 选填：--mode

```bash
siyuan template render \
    --id <id> \
    --path <path> \
    --mode preview
```

### `template save-as`

将文档保存为模板

- 接口：`POST /api/template/docSaveAsTemplate`
- 文档：[模板 > 将文档保存为模板](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#将文档保存为模板)
- 必填：--id --name
- 选填：--overwrite --database-mode

```bash
siyuan template save-as \
    --id <id> \
    --name <name> \
    --database-mode copy
```

### `template sprig`

渲染 Sprig 模板，返回渲染后的字符串

- 接口：`POST /api/template/renderSprig`
- 文档：[模板 > 渲染 Sprig](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#渲染-sprig)
- 必填：--template

```bash
siyuan template sprig \
    --template <template>
```

## 导出

### `export md`

导出文档 Markdown，返回 hPath / content

- 接口：`POST /api/export/exportMdContent`
- 文档：[导出 > 导出 Markdown 文本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#导出-markdown-文本)
- 必填：--id
- 选填：--preserve-task-markers

```bash
siyuan export md \
    --id <id>
```

### `export resources`

导出文件与目录为 zip，返回 data.path

- 接口：`POST /api/export/exportResources`
- 文档：[导出 > 导出文件与目录](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#导出文件与目录)
- 必填：--paths
- 选填：--name

```bash
siyuan export resources \
    --paths path1 \
    --paths path2 \
    --name <name>
```

## 转换

### `convert pandoc`

调用 Pandoc 转换；需先用 file put 写入待转换文件，再用 file get 读取结果

- 接口：`POST /api/convert/pandoc`
- 文档：[转换 > Pandoc](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#pandoc)
- 必填：--dir --args

```bash
siyuan convert pandoc \
    --dir <dir> \
    --args '["--to","markdown_strict-raw_html","foo.epub","-o","foo.md"]'
```

## 通知

### `notify push`

推送消息，返回 data.id

- 接口：`POST /api/notification/pushMsg`
- 文档：[通知 > 推送消息](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#推送消息)
- 必填：--msg
- 选填：--timeout

```bash
siyuan notify push \
    --msg <msg> \
    --timeout 3
```

### `notify err`

推送报错消息，返回 data.id

- 接口：`POST /api/notification/pushErrMsg`
- 文档：[通知 > 推送报错消息](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#推送报错消息)
- 必填：--msg
- 选填：--timeout

```bash
siyuan notify err \
    --msg <msg> \
    --timeout 3
```

## 网络（正向代理）

### `network forward-proxy`

JSON 正向代理，返回 body / status / headers / elapsed

- 接口：`POST /api/network/forwardProxy`
- 文档：[网络 > 正向代理 > JSON 正向代理](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#json-正向代理)
- 必填：--url
- 选填：--method --timeout --content-type --headers --redirect --payload --payload-encoding --response-encoding
- 注意：响应正文解码后上限 32 MiB，超限返回错误码 10；大文件请用 network proxy

```bash
siyuan network forward-proxy \
    --url <url> \
    --method <method> \
    --timeout 3 \
    --content-type <content-type> \
    --headers '[]' \
    --payload '{"key":"value"}' \
    --payload-encoding <payload-encoding> \
    --response-encoding <response-encoding>
```

### `network proxy`

HTTP 正向代理：查询串 u/h/t，请求体原样转发，响应不套 code/msg/data

- 接口：`POST /api/network/proxy`
- 文档：[网络 > 正向代理 > HTTP 正向代理](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#http-正向代理)
- 必填：--url
- 选填：--headers --timeout --method --body --content-type
- 注意：上游非 2xx 也照常输出响应体，退出码仍为 0；响应头带 Siyuan-Proxy- 前缀
- 实验性：是

```bash
siyuan network proxy \
    --url <url> \
    --headers '[]' \
    --timeout <timeout> \
    --method <method> \
    --body <body> \
    --content-type <content-type>
```

### `network ws`

WebSocket 正向代理：stdin 的一行 = 一条消息，收到的消息打印到 stdout

- 接口：`GET /ws/network/proxy`
- 文档：[网络 > 正向代理 > WebSocket 正向代理](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#websocket-正向代理)
- 必填：--url
- 选填：--headers --timeout
- 注意：长连接命令：Ctrl-C 或对端关闭连接后结束
- 实验性：是

```bash
siyuan network ws \
    --url <url> \
    --headers '[]' \
    --timeout <timeout>
```

### `network es`

EventSource 正向代理：把目标 SSE 流原样输出到 stdout

- 接口：`GET /es/network/proxy`
- 文档：[网络 > 正向代理 > EventSource 正向代理](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#eventsource-正向代理)
- 必填：--url
- 选填：--headers --timeout
- 注意：长连接命令：流式输出直到对端关闭；无 Accept 时自动用 text/event-stream
- 实验性：是

```bash
siyuan network es \
    --url <url> \
    --headers '[]' \
    --timeout <timeout>
```

## 系统

### `system boot-progress`

获取启动进度（details / progress）

- 接口：`POST /api/system/bootProgress`
- 文档：[系统 > 获取启动进度](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取启动进度)

```bash
siyuan system boot-progress
```

### `system version`

获取系统版本字符串，如 3.8.6；无需鉴权即可探活

- 接口：`POST /api/system/version`
- 文档：[系统 > 获取系统版本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取系统版本)

```bash
siyuan system version
```

### `system time`

获取系统当前时间（毫秒时间戳）

- 接口：`POST /api/system/currentTime`
- 文档：[系统 > 获取系统当前时间](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取系统当前时间)

```bash
siyuan system time
```

## 数据库 / 属性视图

### `av render`

渲染数据库视图，rows[].id / cards[].id 即条目 ID

- 接口：`POST /api/av/renderAttributeView`
- 文档：[数据库 > 渲染](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#渲染)
- 必填：--id
- 选填：--block-id --view-id --page --page-size --query --group-paging --target-item-id --target-group-id --create-if-not-exist --persist-view

```bash
siyuan av render \
    --id <id> \
    --block-id <block-id> \
    --view-id <view-id> \
    --page 3 \
    --page-size 3 \
    --query <query> \
    --group-paging '{}' \
    --target-item-id <target-item-id> \
    --target-group-id <target-group-id>
```

### `av set-context-filter`

设置数据库块上下文筛选；keyID 传空字符串禁用

- 接口：`POST /api/av/setAttrViewContextFilter`
- 文档：[数据库 > 设置数据库块上下文筛选](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置数据库块上下文筛选)
- 必填：--av-id --block-id --key-id

```bash
siyuan av set-context-filter \
    --av-id <av-id> \
    --block-id <block-id> \
    --key-id <key-id>
```

### `av images`

获取视图中可见资源字段的图片资源路径数组

- 接口：`POST /api/av/getCurrentAttrViewImages`
- 文档：[数据库 > 获取当前数据库视图中的图片](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取当前数据库视图中的图片)
- 必填：--id
- 选填：--block-id --view-id --query

```bash
siyuan av images \
    --id <id> \
    --block-id <block-id> \
    --view-id <view-id> \
    --query <query>
```

### `av get`

获取数据库定义（spec / name / keyValues / keyIDs / views），不含渲染后的行

- 接口：`POST /api/av/getAttributeView`
- 文档：[数据库 > 获取](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取)
- 必填：--id

```bash
siyuan av get \
    --id <id>
```

### `av primary-key-values`

获取主键值，按 block.updated 倒序

- 接口：`POST /api/av/getAttributeViewPrimaryKeyValues`
- 文档：[数据库 > 获取主键值](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取主键值)
- 必填：--id
- 选填：--keyword --page --page-size

```bash
siyuan av primary-key-values \
    --id <id> \
    --keyword <keyword> \
    --page 3 \
    --page-size 3
```

### `av search`

按名称搜索数据库 / 视图

- 接口：`POST /api/av/searchAttributeView`
- 文档：[数据库 > 搜索](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#搜索)
- 必填：--keyword
- 选填：--excludes --include-view-matches

```bash
siyuan av search \
    --keyword <keyword> \
    --excludes exclude1 \
    --excludes exclude2
```

### `av set-cell`

设置单元格值，value 结构由字段 keyType 决定

- 接口：`POST /api/av/setAttributeViewBlockAttr`
- 文档：[数据库 > 设置单元格值](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置单元格值)
- 必填：--av-id --key-id --item-id --value
- 注意：旧参数 rowID 已弃用，CLI 只提供 itemID

```bash
siyuan av set-cell \
    --av-id <av-id> \
    --key-id <key-id> \
    --item-id <item-id> \
    --value '{"text":{"content":"新值"}}'
```

### `av add-items`

添加条目；成功后需调用 av render 获取新行 ID

- 接口：`POST /api/av/addAttributeViewBlocks`
- 文档：[数据库 > 添加条目](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#添加条目)
- 必填：--av-id --block-id --srcs
- 选填：--view-id --group-id --previous-id --ignore-default-fill

```bash
siyuan av add-items \
    --av-id <av-id> \
    --block-id <block-id> \
    --srcs '[{"id":"<块ID>","isDetached":false,"content":"条目"}]' \
    --view-id <view-id> \
    --group-id <group-id> \
    --previous-id <previous-id>
```

### `av remove-items`

移除条目（独立行删除；绑定块仅解绑，不删除底层块）

- 接口：`POST /api/av/removeAttributeViewBlocks`
- 文档：[数据库 > 移除条目](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移除条目)
- 必填：--av-id --src-ids

```bash
siyuan av remove-items \
    --av-id <av-id> \
    --src-ids srcID1 \
    --src-ids srcID2
```

### `av set-layout`

切换视图布局

- 接口：`POST /api/av/changeAttrViewLayout`
- 文档：[数据库 > 切换布局](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#切换布局)
- 必填：--av-id --block-id --layout-type

```bash
siyuan av set-layout \
    --av-id <av-id> \
    --block-id <block-id> \
    --layout-type table
```

### `av set-group`

设置分组，group 为空 field 时移除分组

- 接口：`POST /api/av/setAttrViewGroup`
- 文档：[数据库 > 设置分组](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置分组)
- 必填：--av-id --block-id --group

```bash
siyuan av set-group \
    --av-id <av-id> \
    --block-id <block-id> \
    --group '{"field":"<字段ID>","valueSource":"stored","method":0}'
```

### `av get-filter-sort`

获取当前视图的 filters / sorts

- 接口：`POST /api/av/getAttributeViewFilterSort`
- 文档：[数据库 > 获取过滤与排序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取过滤与排序)
- 必填：--id --block-id

```bash
siyuan av get-filter-sort \
    --id <id> \
    --block-id <block-id>
```

### `av set-filters`

整体替换过滤规则，传 [] 清空

- 接口：`POST /api/av/setAttrViewFilters`
- 文档：[数据库 > 设置过滤](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置过滤)
- 必填：--av-id --block-id --data

```bash
siyuan av set-filters \
    --av-id <av-id> \
    --block-id <block-id> \
    --data '[]'
```

### `av set-sorts`

整体替换排序规则，传 [] 清空

- 接口：`POST /api/av/setAttrViewSorts`
- 文档：[数据库 > 设置排序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置排序)
- 必填：--av-id --block-id --data

```bash
siyuan av set-sorts \
    --av-id <av-id> \
    --block-id <block-id> \
    --data '[]'
```

### `av add-key`

添加字段；keyType 不能为 block

- 接口：`POST /api/av/addAttributeViewKey`
- 文档：[数据库 > 添加字段](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#添加字段)
- 必填：--av-id --key-id --key-name --key-type
- 选填：--key-icon --previous-key-id

```bash
siyuan av add-key \
    --av-id <av-id> \
    --key-id <key-id> \
    --key-name <key-name> \
    --key-type text \
    --key-icon <key-icon> \
    --previous-key-id <previous-key-id>
```

### `av remove-key`

移除字段；字段不存在时返回 code -1 / msg key not found

- 接口：`POST /api/av/removeAttributeViewKey`
- 文档：[数据库 > 移除字段](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移除字段)
- 必填：--av-id --key-id
- 选填：--remove-relation-dest

```bash
siyuan av remove-key \
    --av-id <av-id> \
    --key-id <key-id>
```

### `av sort-key`

设置全局字段顺序（影响所有视图）

- 接口：`POST /api/av/sortAttributeViewKey`
- 文档：[数据库 > 设置全局字段排序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置全局字段排序)
- 必填：--av-id --key-id --previous-key-id

```bash
siyuan av sort-key \
    --av-id <av-id> \
    --key-id <key-id> \
    --previous-key-id <previous-key-id>
```

### `av sort-view-key`

设置指定视图内的列顺序

- 接口：`POST /api/av/sortAttributeViewViewKey`
- 文档：[数据库 > 设置视图内字段排序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置视图内字段排序)
- 必填：--av-id --key-id --previous-key-id
- 选填：--view-id

```bash
siyuan av sort-view-key \
    --av-id <av-id> \
    --key-id <key-id> \
    --previous-key-id <previous-key-id> \
    --view-id <view-id>
```

## 搜索（已保存条件组）

### `search criteria`

获取已保存的搜索条件组数组

- 接口：`POST /api/storage/getCriteria`
- 文档：[搜索 > 获取已保存的搜索条件组](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取已保存的搜索条件组)

```bash
siyuan search criteria
```

### `search set-criterion`

保存（创建或整体覆盖同名）搜索条件组，需要管理员角色

- 接口：`POST /api/storage/setCriterion`
- 文档：[搜索 > 保存搜索条件组](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#保存搜索条件组)
- 必填：--criterion
- 注意：只读模式下不可用

```bash
siyuan search set-criterion \
    --criterion '{"name":"我的条件组","k":"关键字"}'
```

### `search remove-criterion`

按名称移除搜索条件组，需要管理员角色；名称不存在也视为成功

- 接口：`POST /api/storage/removeCriterion`
- 文档：[搜索 > 移除搜索条件组](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移除搜索条件组)
- 必填：--name
- 注意：只读模式下不可用

```bash
siyuan search remove-criterion \
    --name <name>
```
