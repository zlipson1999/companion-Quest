#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> generate"
python3 tools/gen_horizon_masters.py
echo "==> convert"
python3 -c '
import re, subprocess, sys
from pathlib import Path
ids = re.findall(r"^  ([a-z0-9]+): \{", Path("src/data/horizonCreatures.js").read_text(), re.M)
for hid in ids:
    subprocess.check_call([sys.executable, "tools/convert_reference.py",
        f"tools/reference_art/{hid}.png", f"tools/traced_{hid}.json"])
print("converted", len(ids))
'
echo "==> patch make_sprites if needed"
python3 -c '
from pathlib import Path
p = Path("tools/make_sprites.py")
t = p.read_text()
if "if _name in s" not in t:
    old = """        add(trail_id)
    add('\''sludgewad'\'', sludgewad()); add('\''snoozeghoul'\'', snoozeghoul())
    add('\''couchlurk'\'', couchlurk()); add('\''achefang'\'', achefang())
    add('\''brinegnash'\'', brinegnash()); add('\''cindergrind'\'', cindergrind())
"""
    new = """        add(trail_id)
    import glob as _glob
    for _path in sorted(_glob.glob(os.path.join(TRACED_DIR, '\''traced_*.json'\''))):
        _name = os.path.basename(_path)[7:-5]
        if _name in s:
            continue
        if _name.startswith(('\''tile_'\'', '\''field_'\'', '\''prop_'\'', '\''walk_'\'', '\''portrait_'\'', '\''hero_'\'')):
            continue
        add(_name)
    add('\''sludgewad'\'', sludgewad()); add('\''snoozeghoul'\'', snoozeghoul())
    add('\''couchlurk'\'', couchlurk()); add('\''achefang'\'', achefang())
    add('\''brinegnash'\'', brinegnash()); add('\''cindergrind'\'', cindergrind())
"""
    if old not in t:
        raise SystemExit("make_sprites pattern missing")
    p.write_text(t.replace(old, new, 1))
    print("patched")
else:
    print("already patched")
'
echo "==> make_sprites"
python3 tools/make_sprites.py
echo "==> check_art"
python3 tools/check_art.py
python3 tools/check_docs.py || echo "WARN docs"
echo "Done"
