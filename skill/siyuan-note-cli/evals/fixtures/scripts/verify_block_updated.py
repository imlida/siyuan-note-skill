#!/usr/bin/env python3
"""校验「块生命周期」用例：new_block_id.txt 里的块在真实思源实例中已是更新后的内容。

这条链路最容易错在把 block append 的 JSON 返回值直接当成裸 ID，
导致后续 update 根本没作用在目标块上。因此判据直接读思源里该块当前的 kramdown。
退出码 0 表示 PASS。
"""
import json
import pathlib
import re
import sys
import urllib.request

API = "http://127.0.0.1:6806"
EXPECTED = "更新后内容-7Q2X"
BLOCK_ID_RE = re.compile(r"\d{14}-[a-z0-9]{7}")


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
    f = pathlib.Path("new_block_id.txt")
    if not f.exists():
        fail("new_block_id.txt 不存在")
    raw = f.read_text(encoding="utf-8")
    found = BLOCK_ID_RE.findall(raw)
    if not found:
        fail("new_block_id.txt 中找不到合法块 ID，实际内容=%r" % raw[:200])
    block_id = found[0]

    info = post("/api/block/getBlockInfo", {"id": block_id})
    if info.get("code") != 0:
        fail("getBlockInfo 返回 code=%s msg=%s，取到的 ID 不是真实块" % (info.get("code"), info.get("msg")))

    kram = post("/api/block/getBlockKramdown", {"id": block_id})
    if kram.get("code") != 0:
        fail("getKramdown 返回 code=%s msg=%s" % (kram.get("code"), kram.get("msg")))
    src = kram.get("data") or {}
    # 接口返回 {"id":..., "kramdown":...} 对象，不是裸字符串。
    src = (src.get("kramdown") if isinstance(src, dict) else str(src)) or ""
    src = src.strip()
    if EXPECTED not in src:
        fail(
            "块内容不是更新后的文本：期望包含 %r，实际=%r。"
            "通常意味着把 block append 的 JSON 返回值当成了裸块 ID。" % (EXPECTED, src[:200])
        )

    print("PASS: 块 %s 内容已是更新后的 %r" % (block_id, EXPECTED))


if __name__ == "__main__":
    main()
