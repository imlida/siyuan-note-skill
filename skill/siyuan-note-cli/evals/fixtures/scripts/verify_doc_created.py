#!/usr/bin/env python3
"""校验「新建文档」用例：created_doc_id.txt 里的块 ID 在真实思源实例中确实存在。

判定逻辑刻意只看事实，不看 Agent 的自述：
  1. 文件存在且非空；
  2. 内容是一个合法的思源块 ID（14 位时间戳 + 7 位短哈希）；
  3. 直连思源 /api/block/getBlockInfo 确认该块真实存在；
  4. 该文档正文包含任务要求的标记字符串。
退出码 0 表示 PASS。
"""
import json
import pathlib
import re
import sys
import urllib.request

API = "http://127.0.0.1:6806"
MARKER = "7Q2X"
BLOCK_ID_RE = re.compile(r"^\d{14}-[a-z0-9]{7}$")


def post(path: str, payload: dict) -> dict:
    req = urllib.request.Request(
        API + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def fail(msg: str) -> None:
    print("FAIL: " + msg)
    sys.exit(1)


def main() -> None:
    f = pathlib.Path("created_doc_id.txt")
    if not f.exists():
        fail("created_doc_id.txt 不存在")
    raw = f.read_text(encoding="utf-8").strip()
    block_id = raw.strip().strip("`\"'")
    # 容错：Agent 可能把整段输出写进文件，取其中唯一的块 ID。
    found = BLOCK_ID_RE.findall(raw)
    if not found:
        fail("created_doc_id.txt 中找不到合法块 ID，实际内容=%r" % raw[:200])
    block_id = found[0]

    info = post("/api/block/getBlockInfo", {"id": block_id})
    if info.get("code") != 0:
        fail("getBlockInfo 返回 code=%s msg=%s，文档不存在" % (info.get("code"), info.get("msg")))

    kram = post("/api/block/getBlockKramdown", {"id": block_id})
    if kram.get("code") != 0:
        fail("getKramdown 返回 code=%s msg=%s" % (kram.get("code"), kram.get("msg")))
    src = kram.get("data") or {}
    # 接口返回 {"id":..., "kramdown":...} 对象，不是裸字符串。
    src = src.get("kramdown") if isinstance(src, dict) else str(src)
    if MARKER not in (src or ""):
        fail("文档正文不含标记 %s，实际内容=%r" % (MARKER, (src or "")[:200]))

    print("PASS: 文档 %s 真实存在，正文含标记 %s" % (block_id, MARKER))


if __name__ == "__main__":
    main()
