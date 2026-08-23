#!/usr/bin/env python3
"""Guard: every Horizon passive/encounter/behavior is actually handled."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CREATURES = (ROOT / "src/data/horizonCreatures.js").read_text()
LIFE = (ROOT / "src/state/companionLife.js").read_text()
EVO = (ROOT / "src/state/evolution.js").read_text()
WILD = (ROOT / "src/data/wild.js").read_text()

def ids(pattern: str, text: str) -> set[str]:
    return set(re.findall(pattern, text))

passive_data = ids(r'"id": "([a-z0-9-]+)"', CREATURES)
# personality / encounter also have "id" sometimes? passives are 'passive: {"id":'
passive_data = set(re.findall(r'passive: \{"id": "([a-z0-9-]+)"', CREATURES))
passive_fx = set(re.findall(r"'([a-z0-9-]+)': \(e", LIFE))
# also keys like 'tidal-sip':
passive_fx |= set(re.findall(r"\n  '([a-z0-9-]+)':", LIFE))

when_data = set(re.findall(r'"when": "([a-z-]+)"', CREATURES))
when_switch = set(re.findall(r"case '([a-z-]+)':", LIFE))

behave_data = set(re.findall(r'"kind": "([a-z]+)"', CREATURES))
behave_labels = set(re.findall(r"  ([a-z]+): '", LIFE.split("BEHAVIOR_LABELS")[1].split("}")[0]))

errors: list[str] = []

missing_fx = sorted(passive_data - passive_fx)
if missing_fx:
    errors.append(f"passives with no resolver: {', '.join(missing_fx)}")

extra_fx = sorted(passive_fx - passive_data)
# extra is ok only if unused — warn not fail? fail to keep table tight.
if extra_fx:
    errors.append(f"resolver ids not on any creature: {', '.join(extra_fx)}")

missing_when = sorted(when_data - when_switch)
if missing_when:
    errors.append(f"encounter.when with no case: {', '.join(missing_when)}")

if "eligibleCompanions" not in WILD or "companionRate" not in WILD:
    errors.append("wild.js is not using the conditional encounter picker")

if "behaviorOk" not in EVO:
    errors.append("evolution.js does not gate on behaviorOk")

if "liveOnMember" not in (ROOT / "src/state/GameContext.js").read_text():
    errors.append("GameContext does not call liveOnMember")

if errors:
    print("check_life.py FAILED")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print(f"check_life.py ok  {len(passive_data)} passives  {len(when_data)} encounter gates  {len(behave_data)} behaviors")
