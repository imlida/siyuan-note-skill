/**
 * 接口注册表 —— 全局唯一事实来源。
 *
 * 这里每一条 EndpointDef 同时决定：
 *  - CLI 的子命令名与选项（build.ts）
 *  - 请求体 / multipart 的构造与必填校验（runner.ts）
 *  - docs/API-MAPPING.md 与 skill/SKILL.md 的命令清单（scripts/gen-mapping.mjs）
 *
 * 章节名与 https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md 保持一致。
 */
import type { EndpointDef, ParamDef } from './types.js';

function str(
  name: string,
  flag: string,
  desc: string,
  required = false,
  extra: Partial<ParamDef> = {},
): ParamDef {
  return { name, flag, type: 'string', required, desc, ...extra };
}
function num(
  name: string,
  flag: string,
  desc: string,
  required = false,
  extra: Partial<ParamDef> = {},
): ParamDef {
  return { name, flag, type: 'number', required, desc, ...extra };
}
function bool(name: string, flag: string, desc: string, required = false): ParamDef {
  return { name, flag, type: 'boolean', required, desc };
}
function js(
  name: string,
  flag: string,
  desc: string,
  required = false,
  extra: Partial<ParamDef> = {},
): ParamDef {
  return { name, flag, type: 'json', required, desc, ...extra };
}
function arr(
  name: string,
  flag: string,
  desc: string,
  required = false,
  extra: Partial<ParamDef> = {},
): ParamDef {
  return { name, flag, type: 'stringArray', required, desc, ...extra };
}
function fil(name: string, flag: string, desc: string, required = false): ParamDef {
  return { name, flag, type: 'file', required, desc, multiple: true };
}

export const ENDPOINTS: EndpointDef[] = [
  // ───────────────────────── 笔记本 ─────────────────────────
  {
    cmd: ['notebook', 'ls'],
    group: 'notebook',
    section: '笔记本 > 列出笔记本',
    api: '/api/notebook/lsNotebooks',
    method: 'POST',
    summary: '列出全部笔记本（id / name / icon / sort / closed）',
  },
  {
    cmd: ['notebook', 'open'],
    group: 'notebook',
    section: '笔记本 > 打开笔记本',
    api: '/api/notebook/openNotebook',
    method: 'POST',
    summary: '打开笔记本',
    params: [str('notebook', 'notebook', '笔记本 ID', true)],
  },
  {
    cmd: ['notebook', 'close'],
    group: 'notebook',
    section: '笔记本 > 关闭笔记本',
    api: '/api/notebook/closeNotebook',
    method: 'POST',
    summary: '关闭笔记本（校验 ID 时不去除两端空白）',
    params: [str('notebook', 'notebook', '笔记本 ID', true)],
  },
  {
    cmd: ['notebook', 'rename'],
    group: 'notebook',
    section: '笔记本 > 重命名笔记本',
    api: '/api/notebook/renameNotebook',
    method: 'POST',
    summary: '重命名笔记本',
    params: [
      str('notebook', 'notebook', '笔记本 ID', true),
      str('name', 'name', '笔记本的新名称', true),
    ],
  },
  {
    cmd: ['notebook', 'create'],
    group: 'notebook',
    section: '笔记本 > 创建笔记本',
    api: '/api/notebook/createNotebook',
    method: 'POST',
    summary: '创建笔记本，返回 data.notebook',
    params: [str('name', 'name', '笔记本的名称', true)],
  },
  {
    cmd: ['notebook', 'remove'],
    group: 'notebook',
    section: '笔记本 > 删除笔记本',
    api: '/api/notebook/removeNotebook',
    method: 'POST',
    summary: '删除笔记本',
    params: [str('notebook', 'notebook', '笔记本 ID', true)],
  },
  {
    cmd: ['notebook', 'get-conf'],
    group: 'notebook',
    section: '笔记本 > 获取笔记本配置',
    api: '/api/notebook/getNotebookConf',
    method: 'POST',
    summary: '获取笔记本配置（box / conf / name）',
    params: [str('notebook', 'notebook', '笔记本 ID', true)],
  },
  {
    cmd: ['notebook', 'set-conf'],
    group: 'notebook',
    section: '笔记本 > 保存笔记本配置',
    api: '/api/notebook/setNotebookConf',
    method: 'POST',
    summary: '保存笔记本配置，conf 为完整配置对象',
    params: [
      str('notebook', 'notebook', '笔记本 ID', true),
      js('conf', 'conf', '配置对象，如 {"name":"x","closed":false,"refCreateSavePath":""}', true),
    ],
  },
  {
    cmd: ['notebook', 'reorder'],
    group: 'notebook',
    section: '文档 > 相对调整笔记本顺序',
    api: '/api/notebook/reorder',
    method: 'POST',
    summary: '相对调整笔记本顺序（端点属于 notebook，文档归类于「文档」章节）',
    params: [
      arr('sourceIDs', 'source-ids', '按数组顺序插入的源笔记本 ID', true),
      str('targetID', 'target-id', '目标笔记本 ID', true),
      str('position', 'position', '插入位置', true, { choices: ['before', 'after'] }),
    ],
  },

  // ───────────────────────── 文档 ─────────────────────────
  {
    cmd: ['doc', 'create'],
    group: 'doc',
    section: '文档 > 通过 Markdown 创建文档',
    api: '/api/filetree/createDocWithMd',
    method: 'POST',
    summary: '通过 Markdown 创建文档，返回文档 ID；相同 path 不会覆盖已有文档',
    params: [
      str('notebook', 'notebook', '笔记本 ID', true),
      str('path', 'path', '文档路径，以 / 开头，对应 hpath，不存在的父文档会自动创建', true),
      str('markdown', 'markdown', 'GFM Markdown 内容，可为空字符串；@file 从文件读、@- 读 stdin', true, {
        fileLike: true,
      }),
    ],
  },
  {
    cmd: ['doc', 'rename'],
    group: 'doc',
    section: '文档 > 重命名文档（通过路径）',
    api: '/api/filetree/renameDoc',
    method: 'POST',
    summary: '通过路径重命名文档',
    params: [
      str('notebook', 'notebook', '笔记本 ID', true),
      str('path', 'path', '文档路径', true),
      str('title', 'title', '新标题', true),
    ],
  },
  {
    cmd: ['doc', 'rename-by-id'],
    group: 'doc',
    section: '文档 > 重命名文档（通过 ID）',
    api: '/api/filetree/renameDocByID',
    method: 'POST',
    summary: '通过 ID 重命名文档',
    params: [
      str('id', 'id', '文档 ID', true),
      str('title', 'title', '新标题', true),
    ],
  },
  {
    cmd: ['doc', 'remove'],
    group: 'doc',
    section: '文档 > 删除文档（通过路径）',
    api: '/api/filetree/removeDoc',
    method: 'POST',
    summary: '通过路径删除文档',
    params: [
      str('notebook', 'notebook', '笔记本 ID', true),
      str('path', 'path', '文档路径', true),
    ],
  },
  {
    cmd: ['doc', 'remove-by-id'],
    group: 'doc',
    section: '文档 > 删除文档（通过 ID）',
    api: '/api/filetree/removeDocByID',
    method: 'POST',
    summary: '通过 ID 删除文档',
    params: [str('id', 'id', '文档 ID', true)],
  },
  {
    cmd: ['doc', 'move'],
    group: 'doc',
    section: '文档 > 移动文档（通过路径）',
    api: '/api/filetree/moveDocs',
    method: 'POST',
    summary: '通过路径批量移动文档',
    params: [
      arr('fromPaths', 'from-paths', '源路径列表', true),
      str('toNotebook', 'to-notebook', '目标笔记本 ID', true),
      str('toPath', 'to-path', '目标路径', true),
    ],
  },
  {
    cmd: ['doc', 'move-by-id'],
    group: 'doc',
    section: '文档 > 移动文档（通过 ID）',
    api: '/api/filetree/moveDocsByID',
    method: 'POST',
    summary: '通过 ID 批量移动文档',
    params: [
      arr('fromIDs', 'from-ids', '源文档 ID 列表', true),
      str('toID', 'to-id', '目标父文档 ID 或笔记本 ID', true),
    ],
  },
  {
    cmd: ['doc', 'reorder'],
    group: 'doc',
    section: '文档 > 相对调整文档顺序',
    api: '/api/filetree/reorderDocs',
    method: 'POST',
    summary: '相对调整文档顺序，返回 changed / notebook / parentPath',
    params: [
      arr('sourceIDs', 'source-ids', '按数组顺序插入的源文档 ID', true),
      str('targetID', 'target-id', '目标兄弟文档 ID', true),
      str('position', 'position', '插入位置', true, { choices: ['before', 'after'] }),
    ],
  },
  {
    cmd: ['doc', 'set-sort'],
    group: 'doc',
    section: '文档 > 设置笔记本和文档排序值',
    api: '/api/filetree/setSort',
    method: 'POST',
    summary: '设置笔记本和文档排序值，两者至少提供一个',
    params: [
      js('notebookSorts', 'notebook-sorts', '[{id,sort}] 笔记本 ID 及排序值'),
      js('docSorts', 'doc-sorts', '[{id,sort}] 文档 ID 及排序值'),
    ],
    requireAny: ['notebookSorts', 'docSorts'],
    notes: 'docSorts 中的文档必须属于已打开且已解锁的笔记本',
  },
  {
    cmd: ['doc', 'set-sort-mode'],
    group: 'doc',
    section: '文档 > 设置文档的子文档排序方式',
    api: '/api/filetree/setDocSortMode',
    method: 'POST',
    summary: '设置文档的子文档排序方式，0~14 或 null 清除设置',
    params: [
      str('id', 'id', '声明子文档排序方式的普通文档 ID（不接受笔记本根文档 ID）', true),
      num('sortMode', 'sort-mode', '0~14 的排序方式，或 null 清除设置', true, { nullable: true }),
    ],
  },
  {
    cmd: ['doc', 'hpath-by-path'],
    group: 'doc',
    section: '文档 > 根据路径获取人类可读路径',
    api: '/api/filetree/getHPathByPath',
    method: 'POST',
    summary: '根据路径获取人类可读路径（data 为字符串）',
    params: [
      str('notebook', 'notebook', '笔记本 ID', true),
      str('path', 'path', '路径', true),
    ],
  },
  {
    cmd: ['doc', 'hpath-by-id'],
    group: 'doc',
    section: '文档 > 根据 ID 获取人类可读路径',
    api: '/api/filetree/getHPathByID',
    method: 'POST',
    summary: '根据 ID 获取人类可读路径（data 为字符串）',
    params: [str('id', 'id', '块 ID', true)],
  },
  {
    cmd: ['doc', 'path-by-id'],
    group: 'doc',
    section: '文档 > 根据 ID 获取存储路径',
    api: '/api/filetree/getPathByID',
    method: 'POST',
    summary: '根据 ID 获取存储路径，返回 notebook / path',
    params: [str('id', 'id', '块 ID', true)],
  },
  {
    cmd: ['doc', 'ids-by-hpath'],
    group: 'doc',
    section: '文档 > 根据人类可读路径获取 IDs',
    api: '/api/filetree/getIDsByHPath',
    method: 'POST',
    summary: '根据人类可读路径获取匹配的 ID 数组',
    params: [
      str('path', 'path', '人类可读路径', true),
      str('notebook', 'notebook', '笔记本 ID', true),
    ],
  },

  // ───────────────────────── 块 ─────────────────────────
  {
    cmd: ['block', 'insert'],
    group: 'block',
    section: '块 > 插入块',
    api: '/api/block/insertBlock',
    method: 'POST',
    summary: '插入块；nextID / previousID / parentID 至少提供一个，优先级递减',
    params: [
      str('dataType', 'data-type', '数据类型', true, { choices: ['markdown', 'dom'] }),
      str('data', 'data', '待插入的数据；@file 从文件读、@- 读 stdin', true, { fileLike: true }),
      str('nextID', 'next-id', '后一个块 ID（优先级最高）'),
      str('previousID', 'previous-id', '前一个块 ID（优先级次之）'),
      str('parentID', 'parent-id', '父块 ID（优先级最低）'),
    ],
    requireAny: ['nextID', 'previousID', 'parentID'],
  },
  {
    cmd: ['block', 'prepend'],
    group: 'block',
    section: '块 > 插入前置子块',
    api: '/api/block/prependBlock',
    method: 'POST',
    summary: '在父块最前面插入子块',
    params: [
      str('dataType', 'data-type', '数据类型', true, { choices: ['markdown', 'dom'] }),
      str('data', 'data', '待插入的数据', true, { fileLike: true }),
      str('parentID', 'parent-id', '父块 ID', true),
    ],
  },
  {
    cmd: ['block', 'append'],
    group: 'block',
    section: '块 > 插入后置子块',
    api: '/api/block/appendBlock',
    method: 'POST',
    summary: '在父块最后面追加子块',
    params: [
      str('dataType', 'data-type', '数据类型', true, { choices: ['markdown', 'dom'] }),
      str('data', 'data', '待插入的数据', true, { fileLike: true }),
      str('parentID', 'parent-id', '父块 ID', true),
    ],
  },
  {
    cmd: ['block', 'update'],
    group: 'block',
    section: '块 > 更新块',
    api: '/api/block/updateBlock',
    method: 'POST',
    summary: '更新块内容；lockType 为 true 时，解析后块类型不同则拒绝更新',
    params: [
      str('dataType', 'data-type', '数据类型', true, { choices: ['markdown', 'dom'] }),
      str('data', 'data', '待更新的数据', true, { fileLike: true }),
      str('id', 'id', '待更新块 ID', true),
      bool('lockType', 'lock-type', '解析后块类型不同时是否拒绝更新（默认 false）'),
    ],
  },
  {
    cmd: ['block', 'delete'],
    group: 'block',
    section: '块 > 删除块',
    api: '/api/block/deleteBlock',
    method: 'POST',
    summary: '删除块',
    params: [str('id', 'id', '待删除块 ID', true)],
  },
  {
    cmd: ['block', 'move'],
    group: 'block',
    section: '块 > 移动块',
    api: '/api/block/moveBlock',
    method: 'POST',
    summary: '移动块；previousID 与 parentID 不能同时为空，previousID 优先',
    params: [
      str('id', 'id', '待移动块 ID', true),
      str('previousID', 'previous-id', '前一个块 ID（优先使用）'),
      str('parentID', 'parent-id', '父块 ID'),
    ],
    requireAny: ['previousID', 'parentID'],
  },
  {
    cmd: ['block', 'fold'],
    group: 'block',
    section: '块 > 折叠块',
    api: '/api/block/foldBlock',
    method: 'POST',
    summary: '折叠块',
    params: [str('id', 'id', '待折叠块 ID', true)],
  },
  {
    cmd: ['block', 'unfold'],
    group: 'block',
    section: '块 > 展开块',
    api: '/api/block/unfoldBlock',
    method: 'POST',
    summary: '展开块',
    params: [str('id', 'id', '待展开块 ID', true)],
  },
  {
    cmd: ['block', 'kramdown'],
    group: 'block',
    section: '块 > 获取块 kramdown 源码',
    api: '/api/block/getBlockKramdown',
    method: 'POST',
    summary: '获取块 kramdown 源码，返回 id / kramdown',
    params: [str('id', 'id', '待获取块 ID', true)],
  },
  {
    cmd: ['block', 'children'],
    group: 'block',
    section: '块 > 获取子块',
    api: '/api/block/getChildBlocks',
    method: 'POST',
    summary: '获取子块（标题下方块也算子块）',
    params: [str('id', 'id', '父块 ID', true)],
  },
  {
    cmd: ['block', 'transfer-ref'],
    group: 'block',
    section: '块 > 转移块引用',
    api: '/api/block/transferBlockRef',
    method: 'POST',
    summary: '把指向 fromID 的引用转移到 toID',
    params: [
      str('fromID', 'from-id', '定义块 ID', true),
      str('toID', 'to-id', '目标块 ID', true),
      arr('refIDs', 'ref-ids', '引用所在块 ID 列表，不指定则转移所有引用'),
    ],
  },

  // ───────────────────────── 属性 ─────────────────────────
  {
    cmd: ['attr', 'set'],
    group: 'attr',
    section: '属性 > 设置块属性',
    api: '/api/attr/setBlockAttrs',
    method: 'POST',
    summary: '设置块属性；自定义属性必须以 custom- 为前缀',
    params: [
      str('id', 'id', '块 ID', true),
      js('attrs', 'attrs', '属性对象，如 {"custom-foo":"bar"}', true),
    ],
  },
  {
    cmd: ['attr', 'get'],
    group: 'attr',
    section: '属性 > 获取块属性',
    api: '/api/attr/getBlockAttrs',
    method: 'POST',
    summary: '获取块属性（含内置属性 id / title / type / updated 等）',
    params: [str('id', 'id', '块 ID', true)],
  },

  // ───────────────────────── SQL ─────────────────────────
  {
    cmd: ['sql', 'query'],
    group: 'sql',
    section: 'SQL > 执行 SQL 查询',
    api: '/api/query/sql',
    method: 'POST',
    summary: '执行 SQL 查询，返回行数组；发布模式下禁止访问',
    params: [str('stmt', 'stmt', 'SQL 脚本，建议显式使用 LIMIT / OFFSET；@file 从文件读', true, { fileLike: true })],
    notes: '写块后如需立即读取，先执行 sql flush 提交事务',
  },
  {
    cmd: ['sql', 'flush'],
    group: 'sql',
    section: 'SQL > 提交事务',
    api: '/api/sqlite/flushTransaction',
    method: 'POST',
    summary: '提交事务，确保 SQL 索引完成后可被 /api/query/sql 立即读到',
  },

  // ───────────────────────── 资源文件 ─────────────────────────
  {
    cmd: ['asset', 'upload'],
    group: 'asset',
    section: '资源文件 > 上传资源文件',
    api: '/api/asset/upload',
    method: 'POST',
    transport: 'multipart',
    summary: '上传资源文件，返回 succMap / succFiles / errFiles',
    params: [
      str('assetsDirPath', 'assets-dir-path', '资源保存的文件夹路径，以 data 为根，如 /assets/', true),
      fil('file[]', 'file', '待上传文件，可重复传入'),
    ],
    requireAny: ['file[]'],
  },

  // ───────────────────────── 文件 ─────────────────────────
  {
    cmd: ['file', 'get'],
    group: 'file',
    section: '文件 > 获取文件',
    api: '/api/file/getFile',
    method: 'POST',
    transport: 'raw',
    summary: '获取文件内容（原始字节，建议配合 --out 保存）',
    params: [str('path', 'path', '工作空间路径下的文件路径', true)],
    notes: 'HTTP 202 表示失败：code -1 参数错误 / 403 无权限 / 404 未找到 / 405 是目录 / 500 服务器错误',
  },
  {
    cmd: ['file', 'put'],
    group: 'file',
    section: '文件 > 写入文件',
    api: '/api/file/putFile',
    method: 'POST',
    transport: 'multipart',
    summary: '写入文件；isDir 为 true 时仅创建文件夹',
    params: [
      str('path', 'path', '工作空间路径下的文件路径', true),
      bool('isDir', 'is-dir', '为 true 时仅创建文件夹，忽略 file'),
      num('modTime', 'mod-time', '最近访问和修改时间（Unix time，秒）'),
      fil('file', 'file', '待上传的本地文件'),
    ],
  },
  {
    cmd: ['file', 'remove'],
    group: 'file',
    section: '文件 > 删除文件',
    api: '/api/file/removeFile',
    method: 'POST',
    summary: '删除文件',
    params: [str('path', 'path', '工作空间路径下的文件路径', true)],
  },
  {
    cmd: ['file', 'rename'],
    group: 'file',
    section: '文件 > 重命名文件',
    api: '/api/file/renameFile',
    method: 'POST',
    summary: '重命名文件',
    params: [
      str('path', 'path', '原文件路径', true),
      str('newPath', 'new-path', '新文件路径', true),
    ],
  },
  {
    cmd: ['file', 'ls'],
    group: 'file',
    section: '文件 > 列出文件',
    api: '/api/file/readDir',
    method: 'POST',
    summary: '列出文件夹内容（isDir / isSymlink / name / updated）',
    params: [str('path', 'path', '工作空间路径下的文件夹路径', true)],
  },

  // ───────────────────────── 模板 ─────────────────────────
  {
    cmd: ['template', 'render'],
    group: 'template',
    section: '模板 > 渲染模板',
    api: '/api/template/render',
    method: 'POST',
    summary: '渲染模板，返回 content / path / docTreePlan',
    params: [
      str('id', 'id', '调用渲染所在的文档 ID', true),
      str('path', 'path', '模板文件绝对路径', true),
      str('mode', 'mode', '渲染模式', false, { choices: ['preview', 'editorInsert'] }),
    ],
  },
  {
    cmd: ['template', 'save-as'],
    group: 'template',
    section: '模板 > 将文档保存为模板',
    api: '/api/template/docSaveAsTemplate',
    method: 'POST',
    summary: '将文档保存为模板',
    params: [
      str('id', 'id', '源文档 ID', true),
      str('name', 'name', '模板名称（内核清理并加 .md）', true),
      bool('overwrite', 'overwrite', '是否覆盖同名模板；false 且已存在时 code 为 1'),
      str('databaseMode', 'database-mode', '数据库模式', false, { choices: ['copy', 'reference'] }),
    ],
  },
  {
    cmd: ['template', 'sprig'],
    group: 'template',
    section: '模板 > 渲染 Sprig',
    api: '/api/template/renderSprig',
    method: 'POST',
    summary: '渲染 Sprig 模板，返回渲染后的字符串',
    params: [str('template', 'template', '模板内容（含 Sprig 语法）；@file 从文件读', true, { fileLike: true })],
  },

  // ───────────────────────── 导出 ─────────────────────────
  {
    cmd: ['export', 'md'],
    group: 'export',
    section: '导出 > 导出 Markdown 文本',
    api: '/api/export/exportMdContent',
    method: 'POST',
    summary: '导出文档 Markdown，返回 hPath / content',
    params: [
      str('id', 'id', '要导出的文档块 ID', true),
      bool('preserveTaskMarkers', 'preserve-task-markers', 'true 时保留 [/] [-] 等任务标记，否则归一化为 [X]'),
    ],
  },
  {
    cmd: ['export', 'resources'],
    group: 'export',
    section: '导出 > 导出文件与目录',
    api: '/api/export/exportResources',
    method: 'POST',
    summary: '导出文件与目录为 zip，返回 data.path',
    params: [
      arr('paths', 'paths', '要导出的文件或文件夹路径列表', true),
      str('name', 'name', '导出的 zip 文件名，默认 export-YYYY-MM-DD_hh-mm-ss.zip'),
    ],
  },

  // ───────────────────────── 转换 ─────────────────────────
  {
    cmd: ['convert', 'pandoc'],
    group: 'convert',
    section: '转换 > Pandoc',
    api: '/api/convert/pandoc',
    method: 'POST',
    summary: '调用 Pandoc 转换；需先用 file put 写入待转换文件，再用 file get 读取结果',
    params: [
      str('dir', 'dir', '工作目录名，位于 工作空间/temp/convert/pandoc/${dir}', true),
      js('args', 'args', 'Pandoc 命令行参数数组，如 ["--to","markdown_strict-raw_html","foo.epub","-o","foo.md"]', true),
    ],
  },

  // ───────────────────────── 通知 ─────────────────────────
  {
    cmd: ['notify', 'push'],
    group: 'notify',
    section: '通知 > 推送消息',
    api: '/api/notification/pushMsg',
    method: 'POST',
    summary: '推送消息，返回 data.id',
    params: [
      str('msg', 'msg', '消息内容', true),
      num('timeout', 'timeout', '显示时长（毫秒），默认 7000'),
    ],
  },
  {
    cmd: ['notify', 'err'],
    group: 'notify',
    section: '通知 > 推送报错消息',
    api: '/api/notification/pushErrMsg',
    method: 'POST',
    summary: '推送报错消息，返回 data.id',
    params: [
      str('msg', 'msg', '消息内容', true),
      num('timeout', 'timeout', '显示时长（毫秒），默认 7000'),
    ],
  },

  // ───────────────────────── 网络（正向代理） ─────────────────────────
  {
    cmd: ['network', 'forward-proxy'],
    group: 'network',
    section: '网络 > 正向代理 > JSON 正向代理',
    api: '/api/network/forwardProxy',
    method: 'POST',
    summary: 'JSON 正向代理，返回 body / status / headers / elapsed',
    params: [
      str('url', 'url', '转发的 URL', true),
      str('method', 'method', 'HTTP 方法，默认 POST', false, { default: 'POST' }),
      num('timeout', 'timeout', '超时毫秒，默认 7000'),
      str('contentType', 'content-type', '默认 application/json'),
      js('headers', 'headers', '请求标头数组'),
      bool('redirect', 'redirect', '是否跟随重定向，默认 true（最多 2 次）'),
      js('payload', 'payload', '请求体；非合法 JSON 时按原字符串发送', false, { fileLike: true }),
      str('payloadEncoding', 'payload-encoding', '请求体编码，默认 json'),
      str('responseEncoding', 'response-encoding', '响应 body 编码，默认 text'),
    ],
    notes: '响应正文解码后上限 32 MiB，超限返回错误码 10；大文件请用 network proxy',
  },
  {
    cmd: ['network', 'proxy'],
    group: 'network',
    section: '网络 > 正向代理 > HTTP 正向代理',
    api: '/api/network/proxy',
    method: 'POST',
    transport: 'passthrough',
    summary: 'HTTP 正向代理：查询串 u/h/t，请求体原样转发，响应不套 code/msg/data',
    params: [
      str('url', 'url', '目标 http/https URL（自动 base64url 编码到 u）', true),
      js('headers', 'headers', '请求标头对象，如 {"X-Foo":["bar"]}（自动编码到 h）'),
      str('timeout', 'timeout', '连接超时，Go duration 格式，如 30s（编码到 t）'),
      str('method', 'method', '转发给目标的 HTTP 方法，默认 GET', false, {
        default: 'GET',
        cliOnly: true,
      }),
      str('body', 'body', '请求体原文（原样转发）', false, { cliOnly: true, fileLike: true }),
      str('contentType', 'content-type', '请求体 Content-Type', false, { cliOnly: true }),
    ],
    experimental: true,
    notes: '上游非 2xx 也照常输出响应体，退出码仍为 0；响应头带 Siyuan-Proxy- 前缀',
  },
  {
    cmd: ['network', 'ws'],
    group: 'network',
    section: '网络 > 正向代理 > WebSocket 正向代理',
    api: '/ws/network/proxy',
    method: 'GET',
    transport: 'passthrough',
    stream: 'ws',
    summary: 'WebSocket 正向代理：stdin 的一行 = 一条消息，收到的消息打印到 stdout',
    params: [
      str('url', 'url', '目标 ws/wss URL（自动 base64url 编码到 u）', true),
      js('headers', 'headers', '握手请求标头对象（自动编码到 h）'),
      str('timeout', 'timeout', '握手超时，如 30s（编码到 t）'),
    ],
    experimental: true,
    notes: '长连接命令：Ctrl-C 或对端关闭连接后结束',
  },
  {
    cmd: ['network', 'es'],
    group: 'network',
    section: '网络 > 正向代理 > EventSource 正向代理',
    api: '/es/network/proxy',
    method: 'GET',
    transport: 'passthrough',
    stream: 'sse',
    summary: 'EventSource 正向代理：把目标 SSE 流原样输出到 stdout',
    params: [
      str('url', 'url', '目标 http/https URL（自动 base64url 编码到 u）', true),
      js('headers', 'headers', '请求标头对象（自动编码到 h）'),
      str('timeout', 'timeout', '连接超时，如 30s（编码到 t）'),
    ],
    experimental: true,
    notes: '长连接命令：流式输出直到对端关闭；无 Accept 时自动用 text/event-stream',
  },

  // ───────────────────────── 系统 ─────────────────────────
  {
    cmd: ['system', 'boot-progress'],
    group: 'system',
    section: '系统 > 获取启动进度',
    api: '/api/system/bootProgress',
    method: 'POST',
    summary: '获取启动进度（details / progress）',
  },
  {
    cmd: ['system', 'version'],
    group: 'system',
    section: '系统 > 获取系统版本',
    api: '/api/system/version',
    method: 'POST',
    summary: '获取系统版本字符串，如 3.8.6；无需鉴权即可探活',
  },
  {
    cmd: ['system', 'time'],
    group: 'system',
    section: '系统 > 获取系统当前时间',
    api: '/api/system/currentTime',
    method: 'POST',
    summary: '获取系统当前时间（毫秒时间戳）',
  },

  // ───────────────────────── 数据库 / 属性视图 ─────────────────────────
  {
    cmd: ['av', 'render'],
    group: 'av',
    section: '数据库 > 渲染',
    api: '/api/av/renderAttributeView',
    method: 'POST',
    summary: '渲染数据库视图，rows[].id / cards[].id 即条目 ID',
    params: [
      str('id', 'id', '数据库 ID', true),
      str('blockID', 'block-id', '嵌入的数据库块 ID（解析视图/权限/上下文筛选）'),
      str('viewID', 'view-id', '视图 ID，省略时解析或取第一个'),
      num('page', 'page', '页码，默认 1'),
      num('pageSize', 'page-size', '每页条目数，-1 或省略用视图默认（50）'),
      str('query', 'query', '主键值全文过滤关键字'),
      js('groupPaging', 'group-paging', '分组（看板）视图分页配置'),
      str('targetItemID', 'target-item-id', '待定位条目 ID'),
      str('targetGroupID', 'target-group-id', '分组提示'),
      bool('createIfNotExist', 'create-if-not-exist', '数据库不存在时是否创建，默认 true'),
      bool('persistView', 'persist-view', '已废弃，忽略'),
    ],
  },
  {
    cmd: ['av', 'set-context-filter'],
    group: 'av',
    section: '数据库 > 设置数据库块上下文筛选',
    api: '/api/av/setAttrViewContextFilter',
    method: 'POST',
    summary: '设置数据库块上下文筛选；keyID 传空字符串禁用',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('blockID', 'block-id', '要修改的数据库块 ID（必须是 avID 的实例）', true),
      str('keyID', 'key-id', '已配置的关联字段 ID；空字符串表示禁用', true),
    ],
  },
  {
    cmd: ['av', 'images'],
    group: 'av',
    section: '数据库 > 获取当前数据库视图中的图片',
    api: '/api/av/getCurrentAttrViewImages',
    method: 'POST',
    summary: '获取视图中可见资源字段的图片资源路径数组',
    params: [
      str('id', 'id', '数据库 ID', true),
      str('blockID', 'block-id', '数据库块 ID'),
      str('viewID', 'view-id', '视图 ID'),
      str('query', 'query', '主键值过滤关键字'),
    ],
  },
  {
    cmd: ['av', 'get'],
    group: 'av',
    section: '数据库 > 获取',
    api: '/api/av/getAttributeView',
    method: 'POST',
    summary: '获取数据库定义（spec / name / keyValues / keyIDs / views），不含渲染后的行',
    params: [str('id', 'id', '数据库 ID', true)],
  },
  {
    cmd: ['av', 'primary-key-values'],
    group: 'av',
    section: '数据库 > 获取主键值',
    api: '/api/av/getAttributeViewPrimaryKeyValues',
    method: 'POST',
    summary: '获取主键值，按 block.updated 倒序',
    params: [
      str('id', 'id', '数据库 ID', true),
      str('keyword', 'keyword', '主键文本子串过滤（不区分大小写）'),
      num('page', 'page', '页码，默认 1'),
      num('pageSize', 'page-size', '每页条目数，-1 或省略为 16'),
    ],
  },
  {
    cmd: ['av', 'search'],
    group: 'av',
    section: '数据库 > 搜索',
    api: '/api/av/searchAttributeView',
    method: 'POST',
    summary: '按名称搜索数据库 / 视图',
    params: [
      str('keyword', 'keyword', '搜索关键字（匹配数据库名称）', true),
      arr('excludes', 'excludes', '排除的数据库 ID'),
      bool('includeViewMatches', 'include-view-matches', '是否同时搜索视图名称'),
    ],
  },
  {
    cmd: ['av', 'set-cell'],
    group: 'av',
    section: '数据库 > 设置单元格值',
    api: '/api/av/setAttributeViewBlockAttr',
    method: 'POST',
    summary: '设置单元格值，value 结构由字段 keyType 决定',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('keyID', 'key-id', '字段（列）ID', true),
      str('itemID', 'item-id', '行 ID（渲染返回的 rows[].id / cards[].id）', true),
      js('value', 'value', '部分 Value 对象，如 {"text":{"content":"abc"}}', true),
    ],
    notes: '旧参数 rowID 已弃用，CLI 只提供 itemID',
  },
  {
    cmd: ['av', 'add-items'],
    group: 'av',
    section: '数据库 > 添加条目',
    api: '/api/av/addAttributeViewBlocks',
    method: 'POST',
    summary: '添加条目；成功后需调用 av render 获取新行 ID',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('blockID', 'block-id', '拥有该数据库的数据库块 ID', true),
      js('srcs', 'srcs', '[{"id":"...","isDetached":false,"content":"文本","itemID":"可选"}]', true),
      str('viewID', 'view-id', '目标视图'),
      str('groupID', 'group-id', '看板分组 ID（表格/卡片可省略）'),
      str('previousID', 'previous-id', '在此条目 ID 后插入，空为末尾追加'),
      bool('ignoreDefaultFill', 'ignore-default-fill', '是否跳过默认值自动填充'),
    ],
  },
  {
    cmd: ['av', 'remove-items'],
    group: 'av',
    section: '数据库 > 移除条目',
    api: '/api/av/removeAttributeViewBlocks',
    method: 'POST',
    summary: '移除条目（独立行删除；绑定块仅解绑，不删除底层块）',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      arr('srcIDs', 'src-ids', '要移除的行 ID 列表', true),
    ],
  },
  {
    cmd: ['av', 'set-layout'],
    group: 'av',
    section: '数据库 > 切换布局',
    api: '/api/av/changeAttrViewLayout',
    method: 'POST',
    summary: '切换视图布局',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('blockID', 'block-id', '拥有视图的数据库块', true),
      str('layoutType', 'layout-type', '布局类型', true, {
        choices: ['table', 'list', 'gallery', 'kanban'],
      }),
    ],
  },
  {
    cmd: ['av', 'set-group'],
    group: 'av',
    section: '数据库 > 设置分组',
    api: '/api/av/setAttrViewGroup',
    method: 'POST',
    summary: '设置分组，group 为空 field 时移除分组',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('blockID', 'block-id', '拥有视图的数据库块', true),
      js(
        'group',
        'group',
        '{"field":"字段ID","valueSource":"stored|rendered","method":0,"range":{},"order":0,"hideEmpty":false}',
        true,
      ),
    ],
  },
  {
    cmd: ['av', 'get-filter-sort'],
    group: 'av',
    section: '数据库 > 获取过滤与排序',
    api: '/api/av/getAttributeViewFilterSort',
    method: 'POST',
    summary: '获取当前视图的 filters / sorts',
    params: [
      str('id', 'id', '数据库 ID', true),
      str('blockID', 'block-id', '拥有视图的数据库块', true),
    ],
  },
  {
    cmd: ['av', 'set-filters'],
    group: 'av',
    section: '数据库 > 设置过滤',
    api: '/api/av/setAttrViewFilters',
    method: 'POST',
    summary: '整体替换过滤规则，传 [] 清空',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('blockID', 'block-id', '拥有视图的数据库块', true),
      js('data', 'data', '完整的 ViewFilter 数组', true),
    ],
  },
  {
    cmd: ['av', 'set-sorts'],
    group: 'av',
    section: '数据库 > 设置排序',
    api: '/api/av/setAttrViewSorts',
    method: 'POST',
    summary: '整体替换排序规则，传 [] 清空',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('blockID', 'block-id', '拥有视图的数据库块', true),
      js('data', 'data', '完整的 ViewSort 数组', true),
    ],
  },
  {
    cmd: ['av', 'add-key'],
    group: 'av',
    section: '数据库 > 添加字段',
    api: '/api/av/addAttributeViewKey',
    method: 'POST',
    summary: '添加字段；keyType 不能为 block',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('keyID', 'key-id', '新字段 ID（须为合法节点 ID，如 20240118120204-abc1234）', true),
      str('keyName', 'key-name', '字段显示名', true),
      str('keyType', 'key-type', '字段类型', true, {
        choices: [
          'text',
          'number',
          'date',
          'select',
          'mSelect',
          'url',
          'email',
          'phone',
          'location',
          'mAsset',
          'template',
          'created',
          'updated',
          'checkbox',
          'relation',
          'rollup',
          'lineNumber',
        ],
      }),
      str('keyIcon', 'key-icon', '字段图标'),
      str('previousKeyID', 'previous-key-id', '在此字段后插入，空串为默认位置'),
    ],
  },
  {
    cmd: ['av', 'remove-key'],
    group: 'av',
    section: '数据库 > 移除字段',
    api: '/api/av/removeAttributeViewKey',
    method: 'POST',
    summary: '移除字段；字段不存在时返回 code -1 / msg key not found',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('keyID', 'key-id', '要移除的字段 ID', true),
      bool('removeRelationDest', 'remove-relation-dest', '关联字段是否同时移除目标库中反向字段，默认 false'),
    ],
  },
  {
    cmd: ['av', 'sort-key'],
    group: 'av',
    section: '数据库 > 设置全局字段排序',
    api: '/api/av/sortAttributeViewKey',
    method: 'POST',
    summary: '设置全局字段顺序（影响所有视图）',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('keyID', 'key-id', '要移动的字段 ID', true),
      str('previousKeyID', 'previous-key-id', '置于其后方的字段 ID，空串表示移动到首位', true),
    ],
  },
  {
    cmd: ['av', 'sort-view-key'],
    group: 'av',
    section: '数据库 > 设置视图内字段排序',
    api: '/api/av/sortAttributeViewViewKey',
    method: 'POST',
    summary: '设置指定视图内的列顺序',
    params: [
      str('avID', 'av-id', '数据库 ID', true),
      str('keyID', 'key-id', '要移动的字段 ID', true),
      str('previousKeyID', 'previous-key-id', '置于其后方的字段 ID，空串表示移动到首位', true),
      str('viewID', 'view-id', '目标视图，空时使用第一个可用视图'),
    ],
  },

  // ───────────────────────── 搜索（已保存的搜索条件组） ─────────────────────────
  {
    cmd: ['search', 'criteria'],
    group: 'search',
    section: '搜索 > 获取已保存的搜索条件组',
    api: '/api/storage/getCriteria',
    method: 'POST',
    summary: '获取已保存的搜索条件组数组',
  },
  {
    cmd: ['search', 'set-criterion'],
    group: 'search',
    section: '搜索 > 保存搜索条件组',
    api: '/api/storage/setCriterion',
    method: 'POST',
    summary: '保存（创建或整体覆盖同名）搜索条件组，需要管理员角色',
    params: [js('criterion', 'criterion', '完整的搜索条件组对象，至少含 name', true)],
    notes: '只读模式下不可用',
  },
  {
    cmd: ['search', 'remove-criterion'],
    group: 'search',
    section: '搜索 > 移除搜索条件组',
    api: '/api/storage/removeCriterion',
    method: 'POST',
    summary: '按名称移除搜索条件组，需要管理员角色；名称不存在也视为成功',
    params: [str('name', 'name', '条件组名称（唯一键）', true)],
    notes: '只读模式下不可用',
  },
];

export const GROUPS: Array<{ key: string; title: string }> = [
  { key: 'notebook', title: '笔记本' },
  { key: 'doc', title: '文档' },
  { key: 'block', title: '块' },
  { key: 'attr', title: '属性' },
  { key: 'sql', title: 'SQL' },
  { key: 'asset', title: '资源文件' },
  { key: 'file', title: '文件' },
  { key: 'template', title: '模板' },
  { key: 'export', title: '导出' },
  { key: 'convert', title: '转换' },
  { key: 'notify', title: '通知' },
  { key: 'network', title: '网络（正向代理）' },
  { key: 'system', title: '系统' },
  { key: 'av', title: '数据库 / 属性视图' },
  { key: 'search', title: '搜索（已保存条件组）' },
];

export function findEndpoint(cmd: string[]): EndpointDef | undefined {
  return ENDPOINTS.find((e) => e.cmd.length === cmd.length && e.cmd.every((c, i) => c === cmd[i]));
}

export const DOC_BASE_URL =
  'https://github.com/siyuan-note/siyuan/blob/master/docs/API.zh-CN.md';

/** 生成 GitHub 锚点：小写、空格转 -、保留中日韩与字母数字 */
export function anchorOf(section: string): string {
  return section
    .split('>')
    .pop()!
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_\-]/gu, '');
}

export function docUrlOf(section: string): string {
  return `${DOC_BASE_URL}#${anchorOf(section)}`;
}
