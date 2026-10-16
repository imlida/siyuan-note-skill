#!/usr/bin/env python3
"""校验「块属性字符串约束」用例：custom-score 最终以字符串形态落库。

思源的自定义属性值类型固定为 string，直连思源读回该块属性即可确认。
若Agent 没有自行修正数字类型，报错后就没写进去，本脚本会判 FAIL。
退出码 0 表示 PASS。
"""
import json
import pathlib
import sys
import urllib.request

API = "http://127.0.0.1:6806"
SCORE_KEY = "custom-score"
REVIEWER_KEY = "custom-reviewer"


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
    f = pathlib.Path("attrs_result.json")
    if not f.exists():
        fail("attrs_result.json 不存在")
    raw = f.read_text(encoding="utf-8")
    try:
        reported = json.loads(raw)
    except Exception as exc:
        fail("attrs_result.json 不是合法 JSON：%s，内容=%r" % (exc, raw[:200]))

    if not isinstance(reported, dict) or not reported:
        fail("attrs_result.json 应为非空的块属性对象，实际=%r" % (reported,))
    if SCORE_KEY not in reported and REVIEWER_KEY not in reported:
        fail(
            "attrs_result.json 里既没有 %s 也没有 %s，实际键=%s"
            % (SCORE_KEY, REVIEWER_KEY, sorted(reported))
        )

    # 用报告里的块 ID 反查思源，确认落库形态。
    block_id = reported.get("id") or reported.get("blockID")
    if not block_id or not isinstance(block_id, str):
        fail("attrs_result.json 缺少可用于反查的块 id，实际=%r" % (reported,))

    live = post("/api/attr/getBlockAttrs", {"id": block_id})
    if live.get("code") != 0:
        fail("getBlockAttrs 返回 code=%s msg=%s" % (live.get("code"), live.get("msg")))
    attrs = live.get("data") or {}

    if SCORE_KEY not in attrs:
        fail(
            "思源中块 %s 上没有 %s 属性（现有键=%s），"
            "说明数字类型写入失败后没有改成字符串重试。" % (block_id, SCORE_KEY, sorted(attrs))
        )

    value = attrs[SCORE_KEY]
    if not isinstance(value, str):
        fail(
            "%s 在思源中的值类型是 %s 而非 str，违反思源属性约束。"
            "（报告里写的类型=%s）" % (SCORE_KEY, type(value).__name__, type(value).__name__)
        )

    print(
        "PASS: %s=%r 以字符串形态落库（reviewer=%r）"
        % (SCORE_KEY, value, attrs.get(REVIEWER_KEY))
    )


if __name__ == "__main__":
    main()
