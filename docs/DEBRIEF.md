# Companion Quest — debrief

One page. 2026-08-23. Against `main` after #30, #33, and #35.

This is not a changelog. It is what an agent (or a human) should believe
before they touch the repo.

## What this game is

Real fitness is the engine. Companions grow from miles, sessions, habits,
and rest — never from a walk button. Presentation is original. Provenance
is required. Numbers live in `docs/GAME_BIBLE.md` and must agree with
code (`python3 tools/check_docs.py`). Do not delete a guard to make a
check pass. Do not lift the `__DEV__` step injector.

## What already landed on `main`

| PR | What it closed |
|---|---|
| #30 | Slim `CLAUDE.md`, 3-stage family guard, `npm test`, instruction rewrite |
| #33 | First-morning empty states (A26–A30), Options `forgetAll` |
| #35 | Hydrate fixture (A5), `coachTutorial` unregistered (A1), unused `dusk` (A6), sourceless art fails `check_art.py` (A10/A25), grown-form copy (A32) |

House stairs and the front door (A2/A3) were already on `main` via #28.
Play-quality and Trailkeeper UI live on #31/#32 if those are still open.
#35 is on `main`; this PR is the leftover art + debrief, not a second
copy of hydrate/A1/A5/A10/A25/A32.

## Honest debt (still true after this PR unless named below)

- **Phone unproven.** Pedometer, GPS non-duplication, Expo Go vs standalone,
  kill/resume. The published web build cannot walk, by design.
- **Accounts unproven.** Apple/Google handshakes need real client ids and a
  device. Downstream HTTP tests exist (`npm --prefix server run test:friends`).
- **Coach proxy undeployed.** Chat is unavailable in production.
- **Obstacles are still procedural.** Six blobs. That is written down.
- **No release contract, no CI quality gate, no privacy policy.**
- **A16/A17** — Trailkeeper migration unfinished; `PixelButton` ignores
  `scale.touchMin`.
- **A18/A19** — first-run walking beat and on-scene web-trail copy live on
  the play-quality branch if it has not merged.
- **Full Circle** is a designed no-op (A33), not a bug.
- **Stage bar is closed on this branch.** `check_art.py` passes all 18
  families. That means silhouettes differ. It does not mean every face
  is final. Do not loosen the gate.

## What this PR closes

- **A11 Dewbble.** The player attached the missing first-rendition plate:
  stout teardrop, medium blue, pale belly/face, pointed crown, glossy
  dark-blue eyes with two highlights each, tiny smile, 3-finger arms,
  4-toe feet, magenta backdrop. Isolated (magenta is backdrop, not
  body), committed as `tools/reference_art/dewbble.png`, traced. This
  PR does **not** re-render the old indexed JSON back to a PNG.
- **A12 first-bond approval lineup.** The same three attached plates —
  Sproutle, Emberkit, Dewbble — are `lineups/firstbond.png`. Same type
  as Maple/Cairn and the player card.
- **Sproutle family complete.** A second pair of attached plates is
  Bloomtail (adolescent: pear body, cream belly, open pink flower with
  white-tipped petals, leafy tail, white claws — not two unopened
  leaves) and Groveheart (adult: walking grove, bark muscle, tan
  chest, five small trees as hair, lime eyes, moss mantle). Isolated
  from magenta, traced as their own masters. Not tints of Sproutle.
  Ids stay `sproutle` / `bloomtail` / `groveheart`.
- **Emberkit family complete.** A third pair is Pyrelynx (standing
  flame-eared lynx) and Cindermane (fire-mane beast, black ear tufts,
  chevron stripes). Ids stay `emberkit` / `pyrelynx` / `cindermane`.
- **Dewbble family complete.** Ids stay `dewbble` / `tidewade` /
  `maelstride`. Tidewade is the adolescent: pear/squishy biped, forward
  wave-hook crest, sky-blue face+torso oval, 3-finger arms, 3-toe feet,
  six floating bubbles — not a taller Dewbble drip. Maelstride is the
  adult walking tide: athletic humanoid water, navy shadows, glowing
  cyan chest, frothy wave crown, wave shoulders, four-finger+thumb
  claws, water skirt, three-toed clawed feet. Magenta is backdrop
  only, never body. Not a whirlpool and not a taller droplet.
- **Facetel family remade.** Known miss: stage 3 used to be a simpler
  cluster than the baby. Ids stay `facetel` / `prismore` / `quartzspire`.
  Baby is an incomplete geode (kawaii face on the largest crystal,
  three crystal feet). Adolescent is a tall shard-humanoid with the
  face only in a pink heart-chest. Adult is a standing prism with
  two closed-eye faces (crown + heart). Magenta is chroma. Max pair
  IoU 0.465. Thresholds not loosened.
- **Bramblet family from attached plates.** Ids stay `bramblet` /
  `briarthicket` / `hedgeroot`. Magenta keyed out. Baby is a vine
  knot (berries, pink buds, leaf-hands). Adolescent is a walking
  thicket — humanoid, grapes, four roots. Adult is a rooted hedge
  golem — orange-dot eyes, antlers, huge bark arms. Not a taller
  berry-ball. Family plate: `lineups/bramblet_family.png`.
- **Original six.** Stage-1 masters exist for all six: Sproutle,
  Emberkit, Dewbble, Pebblepup, Wispurr, Sporelet. Wispurr already
  had an isolated master plus `wispurr_stage2` / `wispurr_stage3`.
  The six babies sit on `lineups/originalsix.png`.
- **Lanternbud family remade from attached plates.** Ids stay
  `lanternbud` / `gleambud` / `grovelamp` — do not rename. Magenta
  is chroma. Baby: spherical bright-green body, golden eyes, leaf-arms,
  3-toe legs, dark-green bud on top PARTIALLY OPEN with a yellow orb.
  Adolescent Gleambud: slender plant-reptile, opened yellow lotus on
  the head, leaf-plate torso, braided-fiber limbs, tail still a bud.
  Adult Grovelamp: walking path-lamp — lotus crown, six hanging
  lantern-vines, leaf-plate armor. Not a bigger closed bud. Family
  plate: `lineups/lanternbud_family.png`.
- **Wispurr is not missing.** `wispurr` / `galegait` / `skywhorl`
  already have isolated first-rendition masters (`wispurr.png`,
  `wispurr_stage2.png`, `wispurr_stage3.png`) and pass the stage bar.
- **Sporelet family.** Ids stay `sporelet` / `mycobloom` / `canopore`.
  Stage 1 is the incomplete toadstool kid (cream body, red spotted
  cap, dark-brown rim, white/yellow sparkles). Stage 2 is the plated
  scout (cracked loaf-cap, golden gills, shoulder fruiting). Stage 3
  is a rooted canopy (multi-tier brim, hooded face, yellow spore
  sparks, bark legs in moss) — not a bigger spotted kid. Magenta is
  chroma; sparkles and spore sparks stay. Named masters replace the
  old `sporelet_stage2/3.png` mapping. Family plate
  `lineups/sporelet_family.png`.
- **Whistlet family remade (flute-bird).** `familyChain('whistlet')`
  is whistlet → reedgale → stormflute. Ids stay. Magenta is chroma.
  Baby Whistlet is a plump egg-shaped fluffy bird with a short wooden
  flute beak and a five-tube tail. Adolescent Reedgale is a slender
  upright avian with a long recorder beak, peacock-marked wings, and
  a ten-pipe tail (the reed lengthened). Adult Stormflute is a wide
  phoenix-like wind-body: sharp dark beak (not a flute cylinder),
  seven beige pipes on the bottom edge of each wing plus five in the
  tail. Three different silhouettes. Isolated masters + traces.
  `check_art.py` whistlet max pair IoU 0.590. Thresholds unchanged.
- **Spinseed family remade from the attached maple-key plates.**
  `familyChain('spinseed')` is spinseed → whirlkey → samaraile.
  Not Wispurr. Magenta is chroma. The old hovering-bulb traces are
  replaced: Spinseed is a tan ribbed seed-kid with a fan samara crest
  (right-edge notch) and oak-leaf arms; Whirlkey grew leaf-wings and
  three vine legs; Samaraile is a leaf-armor standing sail with eight
  golden key-wings and talons — not a bigger seed. Isolated masters
  and `traced_<id>.json` for those three ids. Family plate:
  `lineups/spinseed_family.png`.
- **Stillcup family remade as moss-kid, bowl-sleeper, walking basin.**
  `familyChain('stillcup')` is stillcup → dewbasin → rainhold.
  Magenta is chroma; pink rim flowers on Rainhold stay. Stage 1 is a
  squat cabbage-crown kid with a rain pearl — not a two-legged cup.
  Stage 2 is bowl-shoulders and an oblong sleepy head rising from the
  pool. Stage 3 is a walking basin with the face in the chest and
  overflowing water — not a snap-back chibi. Isolated named masters
  plus `lineups/stillcup_family.png`.
- **Stage bar remakes** for the other clone trail families (Kitefin,
  Whistlet, Chockit, Dapple, Loftburr, and the rest of
  Gale/Canopy). Each remade stage has its own isolated master and
  `traced_<id>.json`. Ids are permanent. `check_art.py` exits 0.

## What we searched before the plates arrived

`tools/reference_art/`, `assets/`, `tools/traced_dewbble.json`, every git
ref (`git log --all -- '*dewbble*'`), and twelve stashes. Result: JSON
only for Dewbble; tiny pixel-sheet masters for Sproutle and Emberkit.
The attached plates closed that gap. Do not invent a Dewbble PNG from
the indexed grid.

## How to verify

```
python3 tools/check_docs.py
python3 tools/check_art.py
python3 tools/make_sprites.py
node --check server/index.js
EXPO_OFFLINE=1 CI=1 npx expo export --platform android --output-dir /tmp/cq
```

Read `tools/sprite_preview.png` and `tools/reference_art/lineups/firstbond.png`.
The checkers cannot see whether a face is good.

## What this debrief is not

A feature list. A licence to treat another franchise as a design spec.
If a figure in the bible moves, it moved in the same commit as the code.
