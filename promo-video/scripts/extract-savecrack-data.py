#!/usr/bin/env python3
"""Collects the real bytes shown in the save-crack video.

Reads the save files and disassembly used while cracking the format and
writes the few excerpts the video shows to src/savecrack/data.json, so the
project itself contains no save or game files.

Usage: python3 scripts/extract-savecrack-data.py IOS_SAVE DISASSEMBLY \\
           MONEY_BEFORE_PLAIN MONEY_AFTER_PLAIN
  IOS_SAVE            an iOS savedata.dat (its encrypted bytes are shown)
  DISASSEMBLY         objdump output of the iOS binary
  MONEY_*_PLAIN       decrypted iOS saves before and after selling items
"""

import json
import os
import re
import sys

SLOT = 0x1000
MONEY = 0x66960


def hex_lines(data, start, count):
    return [
        " ".join(f"{b:02X}" for b in data[start + i * 16:start + i * 16 + 16])
        for i in range(count)
    ]


def disassembly(path, first, last):
    lines = []
    pattern = re.compile(r"^\s*([0-9a-f]+):\s+(\S+)\s*(.*?)(?:\s+@.*)?$")
    with open(path) as f:
        for line in f:
            m = pattern.match(line)
            if not m:
                continue
            address = int(m.group(1), 16)
            if first <= address <= last:
                operands = re.sub(r"\s*<[^>]*>", "", m.group(3)).strip()
                lines.append({"address": f"{address:x}", "op": m.group(2), "args": operands})
    return lines


def main():
    ios_save, disasm, before, after = sys.argv[1:5]
    with open(ios_save, "rb") as f:
        encrypted = f.read()
    with open(before, "rb") as f:
        plain_before = f.read()
    with open(after, "rb") as f:
        plain_after = f.read()

    data = {
        "fileSize": len(encrypted),
        "hexWall": hex_lines(encrypted, 0x4000, 40),
        # The check in the game's loading code (see DECRYPTION_PROCESS.md).
        "checkCode": disassembly(disasm, 0x322790, 0x3227d2),
        "moneyBefore": plain_before[SLOT + MONEY:SLOT + MONEY + 4].hex(" ").upper(),
        "moneyAfter": plain_after[SLOT + MONEY:SLOT + MONEY + 4].hex(" ").upper(),
        "moneyBeforeValue": int.from_bytes(plain_before[SLOT + MONEY:SLOT + MONEY + 4], "little"),
        "moneyAfterValue": int.from_bytes(plain_after[SLOT + MONEY:SLOT + MONEY + 4], "little"),
    }
    out = os.path.join(os.path.dirname(__file__), "..", "src", "savecrack", "data.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print("wrote", os.path.relpath(out), len(data["checkCode"]), "code lines")


if __name__ == "__main__":
    main()
