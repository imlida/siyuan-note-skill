#!/usr/bin/env python3
"""校验「av set-cell 请求构造」用例：不依赖真实数据库即可判定 value 形态是否正确。

关键设计：用「内核报错停在哪一层」当判据，比造一套真实属性视图稳得多，也更贴近真实失败模式。

思源解析 setAttributeViewBlockAttr 的 body 有先后两层：
  1. 先把 body.value 反序列化成 AVValue。形态写错（如 {"text":"x"} 漏了content）
     → 在这一层就炸，msg 形如
       "json: cannot unmarshal string into Go struct field AVValue.text of type apicontract.AVValueText"
  2. 形态正确才继续查数据库/条目，此时才可能报
       "invalid attribute view id" / "item not found" / "block not found"
     —— 这些说明 value 形态已经通过了校验。

所以只要发一次**故意无效的 avID**：
  - 看到 AVValue/AVValueText → Agent 给的 value 形态是错的；
  - 看到 invalid id / item not found / block not found 等 → 形态正确。
这样既不污染用户的思源数据，也不用维护属性视图 fixture。

退出码 0 表示 PASS。
"""
import json
import pathlib
import re
import subprocess
import sys

# 正文里必须出现的标记，确保这不是一个空壳命令。
MARKER = "已归档"

# 用例给的三个ID。avID 故意保留一个合法格式（14+7），这样报错落在业务层而不是格式校验。
AV_ID = "20260101120000-avprobe"
KEY_ID = "20260101120000-key0001"
ITEM_ID = "20260101120000-item001"

# 形态错误时的特征串（内核在反序列化 AVValue 阶段失败）。
BAD_SHAPE_MARKERS = ("AVValue", "cannot unmarshal")


def fail(msg: str) -> None:
    print("FAIL: " + msg)
    sys.exit(1)


def extract_value(raw: str):
    """从 dry-run 落盘产物里取出 --value 的实际内容。

    用括号配对扫描而不是正则非贪婪匹配——后者会在嵌套对象的第一个 } 处截断，
    把 {"text":{"content":"x"}} 截成 {"text":{"content":"x"}，导致正确形态被误判为错误。
    产物可能是完整 JSON，也可能只是片段，所以两种都试。
    """
    # 先尝试整份 JSON（dry-run 通常打印完整请求体）。
    try:
        doc = json.loads(raw)
        if isinstance(doc, dict):
            body = doc.get("body") if isinstance(doc.get("body"), dict) else doc
            if "value" in body:
                return body["value"]
    except Exception:
        pass

    # 退回括号配对扫描，找到 "value": 后的平衡 JSON。
    m = re.search(r'"value"\s*:\s*', raw)
    if not m:
        return None
    start = m.end()
    while start < len(raw) and raw[start].isspace():
        start += 1
    if start >= len(raw) or raw[start] not in "{[":
        # 裸字符串 / 数字形态。
        end = raw.find(",", start)
        snippet = raw[start : end if end != -1 else len(raw)].strip().rstrip("}")
        return snippet.strip('"') if snippet else None

    opener = raw[start]
    closer = "}" if opener == "{" else "]"
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(raw)):
        ch = raw[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == opener:
            depth += 1
        elif ch == closer:
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(raw[start : i + 1])
                except Exception:
                    return raw[start : i + 1]
    return raw[start:]


def probe_value_shape() -> str:
    """用 Agent 给出的 --value 原文实际打一次请求，返回内核 msg。"""
    f = pathlib.Path("dry_run_output.txt")
    if not f.exists():
        fail("dry_run_output.txt 不存在")
    raw = f.read_text(encoding="utf-8", errors="replace")
    if MARKER not in raw:
        fail("dry-run 产物里没有标记 %r，说明 Agent 压根没构造出这条命令" % MARKER)

    value = extract_value(raw)
    if value is None:
        fail("无法从 dry_run_output.txt 里解析出 value 字段")

    # 只有对象形态才可能是对的；裸字符串 / 数字一定是错的。
    if not isinstance(value, dict):
        fail("value 不是 JSON 对象，实际=%r（文本字段应形如 {\"text\":{\"content\":...}}）" % (value,))

    proc = subprocess.run(
        [
            "siyuan", "av", "set-cell",
            "--av-id", AV_ID,
            "--key-id", KEY_ID,
            "--item-id", ITEM_ID,
            "--value", json.dumps(value, ensure_ascii=False),
        ],
        capture_output=True,
        text=True,
        timeout=90,
    )
    out = proc.stdout + proc.stderr
    try:
        msg = json.loads(out).get("msg") or ""
    except Exception:
        msg = out
    return str(msg)


def main() -> None:
    msg = probe_value_shape()
    hit = [s for s in BAD_SHAPE_MARKERS if s in msg]
    if hit:
        fail(
            "内核在解析 value 时就拒绝了（%s）：%s\n"
            "说明 --value 形态写错了。文本字段应为 {\"text\":{\"content\":\"%s\"}}，"
            "每个 keyType 都要包一层 content。" % (hit, msg[:200], MARKER)
        )

    # 走到业务层报错即证明形态通过校验。
    print("PASS: value 形态通过内核校验（内核已越过反序列化阶段，报的是：%s）" % msg[:140])


if __name__ == "__main__":
    main()