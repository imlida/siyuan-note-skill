#!/usr/bin/env python3
"""校验「av add-key 必填参数」用例：字段真的建进了数据库。

判据落在思源的真实状态上——数据库的 keys 里能查到该 keyID，
而不是看Agent 自述「添加成功」。
退出码 0 表示 PASS。
"""
import json
import pathlib
import re
import sys
import urllib.request

API = "http://127.0.0.1:6806"
NAME = "状态"
NODE_ID_RE = re.compile(r"^\d{14}-[a-z0-9]{7}$")


def post(path: str, payload: dict) -> dict:
    req = urllib.request.Request(
        API + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.load(resp)


def fail(msg: str) -> None:
    print("FAIL: " + msg)
    sys.exit(1)


def find_column(av: dict, key_id: str):
    """字段列表在 data.view.columns 里（不是 data.keys——那个字段在本版本返回 null）。

    这里做多路兜底，因为不同内核版本把字段放在不同位置：
      - data.view.columns   ← 实测 3.8.7 表格视图
      - data.keys          ← 部分版本/其他视图形态
    """
    view = av.get("view") or {}
    columns = view.get("columns")
    if isinstance(columns, list):
        hit = next((c for c in columns if isinstance(c, dict) and c.get("id") == key_id), None)
        if hit:
            return hit

    keys = av.get("keys")
    if isinstance(keys, dict):
        hit = keys.get(key_id)
        if isinstance(hit, dict):
            return hit
    if isinstance(keys, list):
        return next((k for k in keys if isinstance(k, dict) and k.get("id") == key_id), None)
    return None


def main() -> None:
    f = pathlib.Path("av_key_result.json")
    if not f.exists():
        fail("av_key_result.json 不存在")
    try:
        reported = json.loads(f.read_text(encoding="utf-8"))
    except Exception as exc:
        fail("av_key_result.json 不是合法 JSON：%s" % exc)
    if not isinstance(reported, dict):
        fail("av_key_result.json 应为对象，实际=%r" % (reported,))

    av_id = reported.get("avID") or reported.get("avId")
    key_id = reported.get("keyID") or reported.get("keyId")
    if not av_id or not key_id:
        fail("结果文件里缺avID / keyID，实际键=%s" % sorted(reported))

    for label, val in (("avID", av_id), ("keyID", key_id)):
        if not NODE_ID_RE.match(str(val)):
            fail(
                "%s 不是合法节点 ID（需 14 位时间戳 + 7 位字符）：%r。"
                "位数不对时内核会先报 invalid id，掩盖真实问题。" % (label, val)
            )

    payload = {"id": av_id}
    if reported.get("blockID"):
        payload["blockID"] = reported["blockID"]

    res = post("/api/av/renderAttributeView", payload)
    if res.get("code") != 0:
        fail(
            "renderAttributeView 返回 code=%s msg=%s"
            "（若报 invalid attribute view id，说明 avID 只是个随手编的字符串，数据库其实没建成）"
            % (res.get("code"), res.get("msg"))
        )

    av = res.get("data") or {}
    field = find_column(av, str(key_id))
    if field is None:
        view = av.get("view") or {}
        columns = view.get("columns") or []
        sample = [c.get("id") for c in columns if isinstance(c, dict)][:8]
        fail("数据库 %s 里找不到字段 %s（现有字段=%s）" % (av_id, key_id, sample))

    field_name = field.get("name")
    if field_name != NAME:
        fail("字段名应为 %r，实际=%r" % (NAME, field_name))

    key_type = field.get("type")
    if key_type != "text":
        fail("字段类型应为 text，实际=%r" % (key_type,))

    print("PASS: 字段 %s（%r / %s）已建入数据库 %s" % (key_id, field_name, key_type, av_id))


if __name__ == "__main__":
    main()