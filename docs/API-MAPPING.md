# 命令 ↔ 接口 ↔ 文档章节 对照清单

> 本文件由 `npm run mapping` 从 `src/registry.ts` 自动生成，请勿手工编辑。
> 文档基准：`docs/API.zh-CN.md`（<https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md>）。

- 官方文档端点总数：**80**
- 已实现命令数：**80**
- 未实现项：**0**
- 实验性 / 长连接命令：**3**

## 未实现项

无。文档中列出的全部接口均已实现对应子命令。

> 说明：`/api/index` 与 `/api/transactions` 属于文档「行为语义」中明确标注的内部实现，不属公开 API，故不计入。

## 笔记本（9）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `notebook ls` | `/api/notebook/lsNotebooks` | POST | [笔记本 > 列出笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#列出笔记本) | — | — |
| `notebook open` | `/api/notebook/openNotebook` | POST | [笔记本 > 打开笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#打开笔记本) | --notebook | — |
| `notebook close` | `/api/notebook/closeNotebook` | POST | [笔记本 > 关闭笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#关闭笔记本) | --notebook | — |
| `notebook rename` | `/api/notebook/renameNotebook` | POST | [笔记本 > 重命名笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#重命名笔记本) | --notebook --name | — |
| `notebook create` | `/api/notebook/createNotebook` | POST | [笔记本 > 创建笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#创建笔记本) | --name | — |
| `notebook remove` | `/api/notebook/removeNotebook` | POST | [笔记本 > 删除笔记本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除笔记本) | --notebook | — |
| `notebook get-conf` | `/api/notebook/getNotebookConf` | POST | [笔记本 > 获取笔记本配置](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取笔记本配置) | --notebook | — |
| `notebook set-conf` | `/api/notebook/setNotebookConf` | POST | [笔记本 > 保存笔记本配置](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#保存笔记本配置) | --notebook --conf | — |
| `notebook reorder` | `/api/notebook/reorder` | POST | [文档 > 相对调整笔记本顺序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#相对调整笔记本顺序) | --source-ids --target-id --position | — |

## 文档（14）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `doc create` | `/api/filetree/createDocWithMd` | POST | [文档 > 通过 Markdown 创建文档](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#通过-markdown-创建文档) | --notebook --path --markdown | — |
| `doc rename` | `/api/filetree/renameDoc` | POST | [文档 > 重命名文档（通过路径）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#重命名文档通过路径) | --notebook --path --title | — |
| `doc rename-by-id` | `/api/filetree/renameDocByID` | POST | [文档 > 重命名文档（通过 ID）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#重命名文档通过-id) | --id --title | — |
| `doc remove` | `/api/filetree/removeDoc` | POST | [文档 > 删除文档（通过路径）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除文档通过路径) | --notebook --path | — |
| `doc remove-by-id` | `/api/filetree/removeDocByID` | POST | [文档 > 删除文档（通过 ID）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除文档通过-id) | --id | — |
| `doc move` | `/api/filetree/moveDocs` | POST | [文档 > 移动文档（通过路径）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移动文档通过路径) | --from-paths --to-notebook --to-path | — |
| `doc move-by-id` | `/api/filetree/moveDocsByID` | POST | [文档 > 移动文档（通过 ID）](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移动文档通过-id) | --from-ids --to-id | — |
| `doc reorder` | `/api/filetree/reorderDocs` | POST | [文档 > 相对调整文档顺序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#相对调整文档顺序) | --source-ids --target-id --position | — |
| `doc set-sort` | `/api/filetree/setSort` | POST | [文档 > 设置笔记本和文档排序值](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置笔记本和文档排序值) | （--notebook-sorts / --doc-sorts 至少其一） | --notebook-sorts --doc-sorts |
| `doc set-sort-mode` | `/api/filetree/setDocSortMode` | POST | [文档 > 设置文档的子文档排序方式](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置文档的子文档排序方式) | --id --sort-mode | — |
| `doc hpath-by-path` | `/api/filetree/getHPathByPath` | POST | [文档 > 根据路径获取人类可读路径](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#根据路径获取人类可读路径) | --notebook --path | — |
| `doc hpath-by-id` | `/api/filetree/getHPathByID` | POST | [文档 > 根据 ID 获取人类可读路径](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#根据-id-获取人类可读路径) | --id | — |
| `doc path-by-id` | `/api/filetree/getPathByID` | POST | [文档 > 根据 ID 获取存储路径](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#根据-id-获取存储路径) | --id | — |
| `doc ids-by-hpath` | `/api/filetree/getIDsByHPath` | POST | [文档 > 根据人类可读路径获取 IDs](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#根据人类可读路径获取-ids) | --path --notebook | — |

## 块（11）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `block insert` | `/api/block/insertBlock` | POST | [块 > 插入块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#插入块) | --data-type --data（--next-id / --previous-id / --parent-id 至少其一） | --next-id --previous-id --parent-id |
| `block prepend` | `/api/block/prependBlock` | POST | [块 > 插入前置子块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#插入前置子块) | --data-type --data --parent-id | — |
| `block append` | `/api/block/appendBlock` | POST | [块 > 插入后置子块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#插入后置子块) | --data-type --data --parent-id | — |
| `block update` | `/api/block/updateBlock` | POST | [块 > 更新块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#更新块) | --data-type --data --id | --lock-type |
| `block delete` | `/api/block/deleteBlock` | POST | [块 > 删除块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除块) | --id | — |
| `block move` | `/api/block/moveBlock` | POST | [块 > 移动块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移动块) | --id（--previous-id / --parent-id 至少其一） | --previous-id --parent-id |
| `block fold` | `/api/block/foldBlock` | POST | [块 > 折叠块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#折叠块) | --id | — |
| `block unfold` | `/api/block/unfoldBlock` | POST | [块 > 展开块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#展开块) | --id | — |
| `block kramdown` | `/api/block/getBlockKramdown` | POST | [块 > 获取块 kramdown 源码](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取块-kramdown-源码) | --id | — |
| `block children` | `/api/block/getChildBlocks` | POST | [块 > 获取子块](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取子块) | --id | — |
| `block transfer-ref` | `/api/block/transferBlockRef` | POST | [块 > 转移块引用](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#转移块引用) | --from-id --to-id | --ref-ids |

## 属性（2）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `attr set` | `/api/attr/setBlockAttrs` | POST | [属性 > 设置块属性](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置块属性) | --id --attrs | — |
| `attr get` | `/api/attr/getBlockAttrs` | POST | [属性 > 获取块属性](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取块属性) | --id | — |

## SQL（2）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `sql query` | `/api/query/sql` | POST | [SQL > 执行 SQL 查询](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#执行-sql-查询) | --stmt | — |
| `sql flush` | `/api/sqlite/flushTransaction` | POST | [SQL > 提交事务](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#提交事务) | — | — |

## 资源文件（1）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `asset upload` | `/api/asset/upload` | POST | [资源文件 > 上传资源文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#上传资源文件) | --assets-dir-path（--file 至少其一） | --file |

## 文件（5）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `file get` | `/api/file/getFile` | POST | [文件 > 获取文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取文件) | --path | — |
| `file put` | `/api/file/putFile` | POST | [文件 > 写入文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#写入文件) | --path | --is-dir --mod-time --file |
| `file remove` | `/api/file/removeFile` | POST | [文件 > 删除文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#删除文件) | --path | — |
| `file rename` | `/api/file/renameFile` | POST | [文件 > 重命名文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#重命名文件) | --path --new-path | — |
| `file ls` | `/api/file/readDir` | POST | [文件 > 列出文件](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#列出文件) | --path | — |

## 模板（3）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `template render` | `/api/template/render` | POST | [模板 > 渲染模板](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#渲染模板) | --id --path | --mode |
| `template save-as` | `/api/template/docSaveAsTemplate` | POST | [模板 > 将文档保存为模板](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#将文档保存为模板) | --id --name | --overwrite --database-mode |
| `template sprig` | `/api/template/renderSprig` | POST | [模板 > 渲染 Sprig](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#渲染-sprig) | --template | — |

## 导出（2）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `export md` | `/api/export/exportMdContent` | POST | [导出 > 导出 Markdown 文本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#导出-markdown-文本) | --id | --preserve-task-markers |
| `export resources` | `/api/export/exportResources` | POST | [导出 > 导出文件与目录](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#导出文件与目录) | --paths | --name |

## 转换（1）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `convert pandoc` | `/api/convert/pandoc` | POST | [转换 > Pandoc](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#pandoc) | --dir --args | — |

## 通知（2）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `notify push` | `/api/notification/pushMsg` | POST | [通知 > 推送消息](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#推送消息) | --msg | --timeout |
| `notify err` | `/api/notification/pushErrMsg` | POST | [通知 > 推送报错消息](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#推送报错消息) | --msg | --timeout |

## 网络（正向代理）（4）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `network forward-proxy` | `/api/network/forwardProxy` | POST | [网络 > 正向代理 > JSON 正向代理](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#json-正向代理) | --url | --method --timeout --content-type --headers --redirect --payload --payload-encoding --response-encoding |
| `network proxy` | `/api/network/proxy` | POST | [网络 > 正向代理 > HTTP 正向代理](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#http-正向代理) | --url | --headers --timeout --method --body --content-type |
| `network ws` | `/ws/network/proxy` | GET | [网络 > 正向代理 > WebSocket 正向代理](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#websocket-正向代理) | --url | --headers --timeout |
| `network es` | `/es/network/proxy` | GET | [网络 > 正向代理 > EventSource 正向代理](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#eventsource-正向代理) | --url | --headers --timeout |

## 系统（3）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `system boot-progress` | `/api/system/bootProgress` | POST | [系统 > 获取启动进度](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取启动进度) | — | — |
| `system version` | `/api/system/version` | POST | [系统 > 获取系统版本](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取系统版本) | — | — |
| `system time` | `/api/system/currentTime` | POST | [系统 > 获取系统当前时间](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取系统当前时间) | — | — |

## 数据库 / 属性视图（18）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `av render` | `/api/av/renderAttributeView` | POST | [数据库 > 渲染](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#渲染) | --id | --block-id --view-id --page --page-size --query --group-paging --target-item-id --target-group-id --create-if-not-exist --persist-view |
| `av set-context-filter` | `/api/av/setAttrViewContextFilter` | POST | [数据库 > 设置数据库块上下文筛选](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置数据库块上下文筛选) | --av-id --block-id --key-id | — |
| `av images` | `/api/av/getCurrentAttrViewImages` | POST | [数据库 > 获取当前数据库视图中的图片](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取当前数据库视图中的图片) | --id | --block-id --view-id --query |
| `av get` | `/api/av/getAttributeView` | POST | [数据库 > 获取](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取) | --id | — |
| `av primary-key-values` | `/api/av/getAttributeViewPrimaryKeyValues` | POST | [数据库 > 获取主键值](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取主键值) | --id | --keyword --page --page-size |
| `av search` | `/api/av/searchAttributeView` | POST | [数据库 > 搜索](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#搜索) | --keyword | --excludes --include-view-matches |
| `av set-cell` | `/api/av/setAttributeViewBlockAttr` | POST | [数据库 > 设置单元格值](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置单元格值) | --av-id --key-id --item-id --value | — |
| `av add-items` | `/api/av/addAttributeViewBlocks` | POST | [数据库 > 添加条目](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#添加条目) | --av-id --block-id --srcs | --view-id --group-id --previous-id --ignore-default-fill |
| `av remove-items` | `/api/av/removeAttributeViewBlocks` | POST | [数据库 > 移除条目](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移除条目) | --av-id --src-ids | — |
| `av set-layout` | `/api/av/changeAttrViewLayout` | POST | [数据库 > 切换布局](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#切换布局) | --av-id --block-id --layout-type | — |
| `av set-group` | `/api/av/setAttrViewGroup` | POST | [数据库 > 设置分组](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置分组) | --av-id --block-id --group | — |
| `av get-filter-sort` | `/api/av/getAttributeViewFilterSort` | POST | [数据库 > 获取过滤与排序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取过滤与排序) | --id --block-id | — |
| `av set-filters` | `/api/av/setAttrViewFilters` | POST | [数据库 > 设置过滤](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置过滤) | --av-id --block-id --data | — |
| `av set-sorts` | `/api/av/setAttrViewSorts` | POST | [数据库 > 设置排序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置排序) | --av-id --block-id --data | — |
| `av add-key` | `/api/av/addAttributeViewKey` | POST | [数据库 > 添加字段](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#添加字段) | --av-id --key-id --key-name --key-type | --key-icon --previous-key-id |
| `av remove-key` | `/api/av/removeAttributeViewKey` | POST | [数据库 > 移除字段](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移除字段) | --av-id --key-id | --remove-relation-dest |
| `av sort-key` | `/api/av/sortAttributeViewKey` | POST | [数据库 > 设置全局字段排序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置全局字段排序) | --av-id --key-id --previous-key-id | — |
| `av sort-view-key` | `/api/av/sortAttributeViewViewKey` | POST | [数据库 > 设置视图内字段排序](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#设置视图内字段排序) | --av-id --key-id --previous-key-id | --view-id |

## 搜索（已保存条件组）（3）

| 命令 | 接口 | 方法 | 文档章节 | 必填参数 | 选填参数 |
| --- | --- | --- | --- | --- | --- |
| `search criteria` | `/api/storage/getCriteria` | POST | [搜索 > 获取已保存的搜索条件组](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#获取已保存的搜索条件组) | — | — |
| `search set-criterion` | `/api/storage/setCriterion` | POST | [搜索 > 保存搜索条件组](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#保存搜索条件组) | --criterion | — |
| `search remove-criterion` | `/api/storage/removeCriterion` | POST | [搜索 > 移除搜索条件组](https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md#移除搜索条件组) | --name | — |

## CLI 自身提供的辅助命令（不对应任何 API）

| 命令 | 说明 |
| --- | --- |
| `api-list [--format table\|md\|json] [--group <key>]` | 打印命令 ↔ 接口对照清单 |
| `config show` | 打印当前生效配置（token 脱敏）与来源 |
