#!/usr/bin/env python3
"""Check that the numbers in docs/GAME_BIBLE.md still match the code.

CLAUDE.md says: "If you change a number in code, change it there in the same
commit." That is a rule nobody can keep by memory. The bible went thirty commits
stale — still claiming save version 5 when the code was on 8, 21 screens when
there were 28 — because every one of those commits was individually fine and
nobody re-read a forty-thousand-word document to check.

So the rule is enforced instead of remembered. Run this after changing a tuning
constant, a map size, or anything the bible quotes a figure for:

    python3 tools/check_docs.py

It reads the ACTUAL value out of the source and the CLAIMED value out of the
bible and compares them. It deliberately does not try to fix anything: a
mismatch means a human has to decide which one is wrong, and quite often the
answer is that the code changed for a good reason and the prose around the
number needs rewriting, not just the digit.

Adding a check is one line in CHECKS. Please do that when you add a number to
the bible — a documented figure with nothing watching it is the next stale one.
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


def first(pattern, text, label):
    m = re.search(pattern, text)
    if not m:
        raise SystemExit(f'check_docs: could not find {label} — has the source moved?')
    return m.group(1)


def build_checks():
    bible = read('docs/GAME_BIBLE.md')
    game = read('src/state/GameContext.js')
    econ = read('src/state/economy.js')
    cardio = read('src/state/cardioMaths.js')
    maps = read('src/data/maps.js')
    router = read('src/screens/Router.js')

    creatures = read('src/data/creatures.js')
    obstacles = len(re.findall(r"'\w+'", first(r'OBSTACLE_IDS = \[([^\]]+)\]',
                                               creatures, 'OBSTACLE_IDS')))
    companions = len(re.findall(r'^  \w+: \{$', creatures, re.M)) - obstacles

    def map_dims(name):
        blk = maps[maps.index(f'export const {name} = {{'):]
        d = re.search(r'cols: (\d+),\n  rows: (\d+)', blk)
        return f'{d.group(1)}x{d.group(2)}'

    art_kit = read('docs/ART_KIT.md')
    readme = read('README.md')
    claude = read('CLAUDE.md')
    masters = len(list((ROOT / 'tools/reference_art').glob('*.png')))

    checks = [
        ('save version', r'`version: (\d+)`',
         first(r'SAVE_VERSION = (\d+)', game, 'SAVE_VERSION')),
        ('screen count', r'## 4\. Screens \(all (\d+)',
         str(len(re.findall(r'^  \w+: \w+Screen,', router, re.M)))),
        ('component count', r'## 9\. UI components \((\d+)\)',
         str(len(re.findall(r'^export ', read('src/components/index.js'), re.M)))),
        ('atlas cells', r'\+ (\d+) atlas cells',
         str(len(re.findall(r'^  "', read('src/data/tileAtlas.js'), re.M)))),
        ('runtime sprites', r'Sprite inventory \((\d+) runtime',
         str(read('src/data/sprites.js').count('"palette":'))),
        ('kcal per lb-mile walking', r'`KCAL_PER_LB_MILE_WALK = ([\d.]+)`',
         first(r'KCAL_PER_LB_MILE_WALK = ([\d.]+)', cardio, 'walk rate')),
        ('kcal per lb-mile running', r'`KCAL_PER_LB_MILE_RUN = ([\d.]+)`',
         first(r'KCAL_PER_LB_MILE_RUN = ([\d.]+)', cardio, 'run rate')),
        ('run/walk pace threshold', r'`RUN_PACE_MIN_PER_MILE = (\d+)`',
         first(r'RUN_PACE_MIN_PER_MILE = (\d+)', cardio, 'pace threshold')),
        # The roster claim went stale for a release and took a real bug with
        # it: an Index that listed 13 of the 22 and no final evolution at all.
        ('companion creatures', r'\*\*(\d+) companions', str(companions)),
        ('obstacle creatures', r'plus (\d+) obstacles', str(obstacles)),
        ('recipes', r'(\d+) recipes, 18 categories',
         str(len(re.findall(r'^  R\(', read('src/data/recipes.js'), re.M)))),
        ('Kinship Knot price (miles)', r'\*\*Kinship Knot\*\* \| ([\d.]+) mi',
         first(r"itemId: 'knot', price: MILES\(([\d.]+)\)", read('src/data/shop.js'), 'knot price')),
    ]

    for const, label in (('CREDIT_PER_MILE', 'a walked mile'),
                         ('CREDIT_PER_SESSION', 'a completed session'),
                         ('CREDIT_PER_WIN', 'a challenge won'),
                         ('CREDIT_PER_GOAL', 'a habit goal hit')):
        checks.append((f'credit for {label}',
                       r'\(`' + const + r'`\) \| (\d+)',
                       first(const + r' = (\d+)', econ, const)))

    # Not every documented figure lives in the bible. These are checked against
    # the file that actually claims them.
    other = [
        ('committed reference masters', art_kit, r'\*\*(\d+) of the 18', str(masters)),
        ('perks', claude, r'`forge/perks\.js` — (\d+) perks',
         str(len(re.findall(r"^    id: '", read('src/modules/forge/perks.js'), re.M)))),
        ('hub menu entries', claude, r'It lists (\w+) places now',
         WORDS[len(re.findall(r"^  \{ label: '", read('src/screens/HubScreen.js'), re.M))]),
        ('README module count', readme, r'plugin system \+ (\d+) modules',
         str(len(first(r'MODULES = \[([^\]]+)\]',
                       read('src/modules/index.js'), 'MODULES').split(',')))),
        ('CLAUDE.md save version', claude, r'auto-migrated by `version`, currently\n\*\*(\d+)\*\*',
         first(r'SAVE_VERSION = (\d+)', game, 'SAVE_VERSION')),
    ]

    for name, label in (('HUB', r'Maple Lane \(`HUB`\)'),
                        ('GYM', r'Quest Fitness \(`GYM`\)'),
                        ('DOWNSTAIRS', r'Downstairs \(`DOWNSTAIRS`\)'),
                        ('BEDROOM', r'Bedroom \(`BEDROOM`\)')):
        checks.append((f'{name} size', label + r' \| (\d+.\d+) \|', map_dims(name)))

    return bible, checks, other


WORDS = {0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
         6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
         11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen'}


def main():
    bible, checks, other = build_checks()
    bad = []
    for label, pattern, actual in checks + [(l, p, a) for l, _, p, a in other]:
        doc = bible if not any(l == label for l, _, _, _ in other) else \
            next(d for l, d, _, _ in other if l == label)
        m = re.search(pattern, doc)
        claimed = m.group(1).replace('×', 'x') if m else None
        good = claimed == actual.replace('×', 'x')
        print(f"{'ok  ' if good else 'DRIFT'} {label:<30} "
              f"doc={claimed or '(missing)':<10} code={actual}")
        if not good:
            bad.append(label)

    print()
    if bad:
        print(f'{len(bad)} documented figure(s) no longer match the code:')
        for b in bad:
            print(f'  - {b}')
        print('\nFix the doc (and the prose around the number, not just the digit).')
        return 1
    print(f'The docs agree with the code on all {len(checks) + len(other)} checked figures.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
