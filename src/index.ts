#!/usr/bin/env node
/**
 * siyuan-note-cli 入口。
 *
 * 全部命令由 src/registry.ts 驱动生成，本文件只负责启动与兜底错误处理。
 */
import { main } from './build.js';

main();
