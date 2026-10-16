#!/usr/bin/env python3
"""校验「SQL 检索」用例：唯一标记确实能通过思源 SQL 检索到，且 ID 文件内容有效。

这条用例针对「刚写完就查、索引还没提交」这个高频陷阱。
若Agent 漏了 siyuan sql flush，检索会查不到，本脚本同样会判FAIL——
因为它自己直连 SQL，用的是与Agent 完全独立的一次查询。
退出码 0 表示 PASS。
"""
import json
import pathlib
import re
import sys
import urllib.request

API = "http://127.0.0.1:6806"
MARKER = "SKILLUP-EVAL-7Q2X"
BLOCK_ID_RE = re.compile(r"\d{14}-[a-z0-9]{7}")


def sql(stmt: str):
    req = urllib.request.Request(
        API + "/api/query/sql",
        data=json.dumps({"stmt": stmt}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.load(resp)


def fail(msg: str) -> None:
    print("FAIL: " + msg)
    sys.exit(1)


def main() -> None:
    f = pathlib.Path("sql_hit_id.txt")
    if not f.exists():
        fail("sql_hit_id.txt 不存在")
    raw = f.read_text(encoding="utf-8")
    found = BLOCK_ID_RE.findall(raw)
    if not found:
        fail("sql_hit_id.txt 中找不到合法块 ID，实际内容=%r" % raw[:200])

    res = sql("SELECT id, content FROM blocks WHERE content LIKE '%" + MARKER + "%' LIMIT 10")
    if res.get("code") != 0:
        fail("querySQL 返回 code=%s msg=%s" % (res.get("code"), res.get("msg")))

    rows = res.get("data") or []
    if not rows:
        fail(
            "思源 SQL 查不到标记 %s。写入后未提交事务会导致索引读不到，"
            "应先执行 siyuan sql flush 再查询。" % MARKER
        )

    hit_ids = {r.get("id") for r in rows}
    if not hit_ids & set(found):
        fail(
            "sql_hit_id.txt 里的 ID %s 与实际检索结果 %s 不一致，"
            "说明报告的命中块并非真实检索所得。" % (found[0], sorted(hit_ids))
        )

    print("PASS: 标记 %s 检索到 %d 行，命中 ID %s 与报告一致" % (MARKER, len(rows), found[0]))


if __name__ == "__main__":
    main()
