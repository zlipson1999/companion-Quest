#!/usr/bin/env python3
"""Horizon family kit: roster data, original stage art, and JS emit.

Draws 120 original companion masters (40 families x baby/adolescent/adult)
as isolated transparent PNGs. Each stage is a different silhouette so
tools/check_art.py's IoU gate can pass. These are interim authored masters
until the user sends first-rendition plates — they are drawn here, not
re-rendered from traced JSON.

    python3 tools/horizon_kit.py --emit-js
    python3 tools/horizon_kit.py --draw
    python3 tools/horizon_kit.py --convert
"""
from __future__ import annotations

import argparse
import math
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(HERE, 'reference_art')
SIZE = 192

# dark, light, accent-dark, accent-light, belly-dark, belly-light
# Original ramps. No shared ink — outline is the body's own dark.
PALS = {
    'brineling':  (('#0a3c40', '#8ef0dc'), ('#8a3a30', '#ffb8a0'), ('#d8fff4', '#ffffff')),
    'dusthorn':   (('#5a2a10', '#e8b060'), ('#8a4a10', '#ffd070'), ('#f4e0b8', '#fff8e0')),
    'mireblink':  (('#1a3a28', '#8cbc70'), ('#1a2048', '#7a88d0'), ('#c8f070', '#f0ffb0')),
    'pinepuff':   (('#143018', '#6a9a48'), ('#4a3018', '#c8a070'), ('#e8f4f8', '#ffffff')),
    'clinket':    (('#5a2a14', '#d08040'), ('#1a4a3a', '#70b090'), ('#c8a878', '#f0d8b0')),
    'glintfoal':  (('#14143a', '#6a58b0'), ('#c8d0e8', '#ffffff'), ('#e8e8ff', '#ffffff')),
    'propfin':    (('#1a3a20', '#6a9a50'), ('#3a2814', '#8a6a40'), ('#70c0b0', '#d0f4e8')),
    'zapram':     (('#2a3038', '#c8d0d8'), ('#1040a0', '#60d0ff'), ('#f0f4f8', '#ffffff')),
    'nectlet':    (('#6a3a08', '#e8b040'), ('#3a2010', '#8a5a30'), ('#fff0c8', '#ffffff')),
    'chipmagma':  (('#101018', '#3a3a48'), ('#8a1808', '#ff7030'), ('#6a6a70', '#c8c8d0')),
    'bellbun':    (('#203070', '#7090e0'), ('#7060a0', '#c8b0e8'), ('#f0e8d8', '#ffffff')),
    'nailnut':    (('#2a2a30', '#8a8a98'), ('#2a1c10', '#6a4a28'), ('#4a6a30', '#90b060')),
    'pipolyp':    (('#b05060', '#ffb0c0'), ('#107070', '#70e0d0'), ('#fff0d8', '#ffffff')),
    'veilisk':    (('#c07020', '#f0c070'), ('#d08080', '#f0c0c0'), ('#80d0d0', '#d0f8f8')),
    'plinkbat':   (('#1a1a24', '#4a4a60'), ('#204060', '#70a0c0'), ('#b090a8', '#e8d0e0')),
    'burrcalf':   (('#8a6a20', '#e0c060'), ('#4a3018', '#8a6038'), ('#706080', '#c0b0d0')),
    'prismink':   (('#0a3040', '#40a0a8'), ('#801848', '#e060a0'), ('#e8f4f8', '#ffffff')),
    'kneebit':    (('#3a2818', '#8a6a40'), ('#2a4a20', '#70a050'), ('#80b0c0', '#d0e8f0')),
    'mumblewool': (('#604070', '#c090c8'), ('#805070', '#d0a0b8'), ('#f0e8d8', '#ffffff')),
    'skiprock':   (('#2a2a30', '#6a6a78'), ('#0a2048', '#3060a0'), ('#e0f0f4', '#ffffff')),
    'glimrice':   (('#2a4a18', '#90c050'), ('#c8a020', '#f0e070'), ('#f4f0e0', '#ffffff')),
    'roseling':   (('#c07080', '#f0c0c8'), ('#a08090', '#e0c0d0'), ('#f8f0e8', '#ffffff')),
    'wicklet':    (('#2a4a20', '#80b060'), ('#208060', '#70d0a0'), ('#70a0d0', '#c0e0f0')),
    'sootfinch':  (('#181818', '#484848'), ('#c04010', '#ff8020'), ('#e8d8c0', '#fff8e8')),
    'budice':     (('#2060a0', '#80c0e0'), ('#102040', '#304070'), ('#f0c0c8', '#fff0f4')),
    'niblet':     (('#3a2010', '#8a5a30'), ('#601020', '#b04050'), ('#3a6020', '#80b050')),
    'siltip':     (('#3a4a20', '#80a050'), ('#206060', '#50a0a0'), ('#c8b080', '#f0e0c0')),
    'mistyak':    (('#d0d8e0', '#ffffff'), ('#305070', '#70a0c0'), ('#e0d0a0', '#fff8d0')),
    'twigglypt':  (('#3a2410', '#8a6030'), ('#8a5010', '#d09030'), ('#2a2a28', '#6a6a60')),
    'glyphish':   (('#0a1838', '#3060a0'), ('#d0d8e0', '#ffffff'), ('#a08020', '#e0c050')),
    'knockit':    (('#4a6a20', '#a0c060'), ('#8a6a30', '#d0b070'), ('#f0e8d0', '#ffffff')),
    'pepkit':     (('#a01810', '#f06030'), ('#c09010', '#f0d040'), ('#c09050', '#f0d090')),
    'pebbloom':   (('#d0d8e0', '#ffffff'), ('#80a0c8', '#d0e8f8'), ('#2a2a30', '#6a6a78')),
    'lotuslet':   (('#d06080', '#f0a0b8'), ('#208050', '#70c080'), ('#70b0d0', '#c0e0f0')),
    'kernelit':   (('#8a6a20', '#e0c060'), ('#4080c0', '#90c0e0'), ('#f4ecd0', '#ffffff')),
    'conecko':    (('#6a2818', '#c06040'), ('#1a3a18', '#508030'), ('#e8d8c0', '#fff8e8')),
    'bloopot':    (('#d0d8d8', '#ffffff'), ('#108080', '#50d0c8'), ('#8a3a20', '#c07040')),
    'figbat':     (('#401848', '#804080'), ('#2a4a18', '#70a040'), ('#f0e0c0', '#fff8e0')),
    'ammonip':    (('#8a6a38', '#d0b070'), ('#8a3a18', '#c06030'), ('#f0e8d0', '#ffffff')),
    'tinkid':     (('#3080c0', '#90d0f0'), ('#f0f4f8', '#ffffff'), ('#40a050', '#90d080')),
}

# type / hp / catch / species / flavor — ids are permanent
FAMILIES = [
    ('brineling', 'shoregleam', 'tidecrown', 'tide', (58, 98, 150), 0.52,
     ('Sea-Glass Hermit Companion', 'Tidal Ribbon Companion', 'Surf-Crown Guardian Companion'),
     ('A sea-glass hermit no bigger than a palm. Salt air makes its pearl eyes brighter.',
      'The shell facets. Tidal ribbons trail the walk you actually take.',
      'A standing crown of surf and coral. Miles of coast live in it.')),
    ('dusthorn', 'mesaquill', 'suncerast', 'stone', (62, 104, 160), 0.48,
     ('Sandstone Horn Companion', 'Sun-Quill Companion', 'Mesa-Crown Guardian Companion'),
     ('A round sandstone pup with tiny hornlets. Heat does not hurry it.',
      'Layered stone scales and sunlit quills. It runs the mesa you climb.',
      'A mesa-backed guardian. The horn-crown holds the day you finished.')),
    ('mireblink', 'lunareed', 'fenoracle', 'rest', (56, 96, 148), 0.54,
     ('Reed-Glow Companion', 'Luminous Jumper Companion', 'Moonfen Guardian Companion'),
     ('A soft frog with one glowing throat bead. Still nights suit it.',
      'Long reed legs and frills of light. The fen is how it learned to jump.',
      'A reed-mantled guardian. Floating lights keep the walk honest.')),
    ('pinepuff', 'rimecone', 'frostbough', 'grove', (60, 100, 154), 0.50,
     ('Snowcap Cone Companion', 'Frost-Branch Companion', 'Evergreen Guardian Companion'),
     ('A fuzzy cone with a snowcap and twig feet. Cold mornings wake it.',
      'It stands. Frosted branch-arms hold the pass you walked.',
      'Cone-plated chest, snow-laden boughs. Winter is a habit it keeps.')),
    ('clinket', 'bellstride', 'canyonchime', 'stone', (64, 108, 164), 0.46,
     ('Copper Bell Companion', 'Resonant Plate Companion', 'Canyon-Chime Guardian Companion'),
     ('A plated pup whose ears are little bells. Each step rings once.',
      'Longer copper plates and a ringed tail. The canyon answers it.',
      'Overlapping armor that rings like canyon bells. You earned the pitch.')),
    ('glintfoal', 'astramare', 'cometmane', 'wind', (54, 94, 146), 0.58,
     ('Star-Speck Foal Companion', 'Constellation Companion', 'Comet-Mane Guardian Companion'),
     ('A tiny foal with a luminous coat and a comet tuft. Night walks suit it.',
      'Sleek, constellation-marked. Open prairie is the map on its side.',
      'A celestial horse. The mane is every late walk you did not skip.')),
    ('propfin', 'mangrusk', 'rootback', 'tide', (60, 102, 156), 0.50,
     ('Prop-Root Companion', 'Root-Fin Companion', 'Grove-Back Guardian Companion'),
     ('A round mudskipper with prop-root fins. Boardwalks are its idea of home.',
      'Long body, branching fins. It climbs the roots you walk beside.',
      'A mangrove on legs. The grove on its back grew from showing up.')),
    ('zapram', 'voltibex', 'stormhorn', 'wind', (62, 104, 162), 0.48,
     ('Static Kid Companion', 'Zigzag Horn Companion', 'Storm-Horn Guardian Companion'),
     ('A stocky kid in blue-gray tufts. Gold-and-electric horns and a gold chevron on the white V-ruff — Static Ridge weather, small.',
      'A slender ibex. Lightning-bolt horns, gold eyes, a blue-and-yellow strike for a collar. Not the kid grown larger.',
      'A navy stag. Cloud-fur mane, gold-framed gems, cyan-veined antlers. High country, kept.')),
    ('nectlet', 'combwing', 'apiarch', 'grove', (56, 96, 150), 0.54,
     ('Honeycomb Fawn Companion', 'Comb-Wing Companion', 'Orchard Guardian Companion'),
     ('A fawn with honeycomb ear patches. Orchard lanes make it brave.',
      'Shoulder wings like comb. It follows the bloom you walk through.',
      'Wax antlers, amber mantle, pollinator wings. The orchard knows it.')),
    ('chipmagma', 'shardscale', 'obsidrake', 'ember', (64, 110, 166), 0.46,
     ('Glass-Seam Companion', 'Obsidian Fin Companion', 'Volcanic-Glass Guardian Companion'),
     ('A black-glass salamander with ember seams. Heat is a friend, not a dare.',
      'Blade-like fins. The hollow taught it a longer stride.',
      'Low-slung glass armor with light underneath. Hard days, held.')),
    ('bellbun', 'chimehare', 'bloomrunner', 'grove', (52, 92, 144), 0.60,
     ('Bluebell Rabbit Companion', 'Flower-Ear Companion', 'Petal-Stream Guardian Companion'),
     ('A round rabbit whose ears are bell-flowers. Wind rings them.',
      'Long hare, flowering ear stalks. Downs are for running, not hurrying.',
      'Sweeping floral ears and a petal-stream tail. Spring, practiced.')),
    ('nailnut', 'ferracorn', 'ironstag', 'stone', (66, 110, 168), 0.45,
     ('Iron-Cap Companion', 'Bark-Antler Companion', 'Ironwood Guardian Companion'),
     ('An acorn-bodied calf with a metallic cap. The wilds sound like a forge.',
      'Bark hide, budding metal antlers. Ironwood is a pace, not a place.',
      'Forged-looking antlers, deep bark armor. Years of the same trail.')),
    ('pipolyp', 'reeframble', 'coralith', 'tide', (58, 100, 154), 0.52,
     ('Polyp Companion', 'Branching Reef Companion', 'Coral-Crown Guardian Companion'),
     ('A round polyp with eight soft nubs. Steps of anemone suit it.',
      'Mobile reef, branching arms. The stair is something it climbs with you.',
      'A cathedral-like coral crown around a gentle octopus core.')),
    ('veilisk', 'duneshade', 'mirajinn', 'stone', (54, 96, 148), 0.56,
     ('Sail-Crest Companion', 'Heat-Haze Companion', 'Mirage-Sail Guardian Companion'),
     ('A tiny gecko with a translucent sail. Heat-haze is its idea of shade.',
      'Lean, with broad membranes. Dunes are for crossing, not racing.',
      'Sails that bend light. The track stays because you walked it.')),
    ('plinkbat', 'cavernwing', 'rainvault', 'rest', (50, 90, 144), 0.58,
     ('Droplet-Ear Companion', 'Mineral-Wing Companion', 'Cavern-Ceiling Guardian Companion'),
     ('A round bat with droplet ears. Dripstone is a metronome it likes.',
      'Mineral-veined wings. The forest above the cave is still a cave to it.',
      'Wings like a dripping ceiling. Shelter you made by slowing down.')),
    ('burrcalf', 'thistlebuck', 'prairieguard', 'grove', (68, 112, 170), 0.44,
     ('Thistle Calf Companion', 'Shoulder-Burr Companion', 'Thistle-Mane Guardian Companion'),
     ('A fuzzy calf with soft thistle tufts. Steppe wind combs it.',
      'Stocky, flowering shoulder burrs. The way is longer than it looks.',
      'Wind-swept thistle mane, seed-down beard. The prairie keeps pace.')),
    ('prismink', 'aurorermine', 'polarveil', 'wind', (54, 94, 148), 0.56,
     ('Ribbon-Tail Companion', 'Aurora-Stripe Companion', 'Light-Mantle Guardian Companion'),
     ('A sleek mink with a glowing ribbon tail. Shelf ice does not scare it.',
      'Longer, with a shifting stripe. Cold miles wrote the colour in.',
      'A polar mantle of light-ribbons. Stillness and distance, both.')),
    ('kneebit', 'swampstride', 'cypressage', 'rest', (64, 108, 166), 0.46,
     ('Knee-Shell Companion', 'Woody-Shell Companion', 'Cypress-Basin Guardian Companion'),
     ('A tiny turtle with cypress-knee spikes. Loops of water suit it.',
      'Long-legged marsh turtle. The basin is a walk, not a wade.',
      'Knees, moss and shallow water on a shell. Age is just repetition.')),
    ('mumblewool', 'heatheram', 'moorwarden', 'grove', (60, 102, 158), 0.50,
     ('Heather Lamb Companion', 'Sprig-Horn Companion', 'Moorland Guardian Companion'),
     ('A lamb with lavender wool curls. Quiet heather is its volume.',
      'Young ram, heather sprigs, curled horns. The moor taught it stance.',
      'Flowering fleece, sweeping horns. A warden that does not shout.')),
    ('skiprock', 'basalisk', 'breakwater', 'tide', (62, 106, 164), 0.48,
     ('Basalt Pup Companion', 'Stone-Back Companion', 'Breakwater Guardian Companion'),
     ('A seal pup with flat basalt plates. Skipping stones are cousins.',
      'Sleek, layered volcanic back. The traverse is a rhythm it already has.',
      'Breakwater armor, foam mane. Coast held, not conquered.')),
    ('glimrice', 'paddyglow', 'terracelume', 'grove', (54, 94, 148), 0.56,
     ('Grain-Crest Companion', 'Rice-Stalk Companion', 'Terrace-Wing Guardian Companion'),
     ('A chick with a glowing grain crest. Lantern paths make it sing.',
      'Slender crane, stalk feathers, firefly lights. Terraces are steps.',
      'Terraced wings, a halo of golden insects. Evening, kept.')),
    ('roseling', 'facetram', 'quartzibex', 'stone', (58, 100, 156), 0.50,
     ('Crystal-Curl Companion', 'Facet-Horn Companion', 'Rose-Quartz Guardian Companion'),
     ('A lamb with crystal curls. Heartstone walks polish it.',
      'Agile ram, translucent horns. The vale is a climb it enjoys.',
      'Enormous rose-quartz spirals, crystal shoulder plates. Still standing.')),
    ('wicklet', 'willowisp', 'mereweaver', 'rest', (50, 90, 142), 0.60,
     ('Leaf-Wing Companion', 'Frond-Wing Companion', 'Willow-Wing Guardian Companion'),
     ('A tiny dragonfly with leaf-shaped wings. Drooping branches are a roof.',
      'Long flyer, trailing frond wings. The mere is a circuit, not a shortcut.',
      'Sweeping willow wings that skim water. Calm is the work.')),
    ('sootfinch', 'ashlark', 'emberchorus', 'ember', (52, 92, 146), 0.58,
     ('Ember-Feather Companion', 'Ash-Edge Companion', 'Ash-Plume Guardian Companion'),
     ('A soot bird with one ember feather. Cindergrass does not choke it.',
      'Lean lark, glowing ash-edged wings. Fields after fire still feed a walk.',
      'Broad ash plume, ember-lit flight feathers. Song you showed up for.')),
    ('budice', 'petalfloe', 'glacibloom', 'wind', (58, 98, 152), 0.52,
     ('Frozen-Bud Companion', 'Ice-Petal Companion', 'Ice-Blossom Guardian Companion'),
     ('A small penguin with a frozen bud crest. Circuits on ice suit it.',
      'Sleek, petal-like ice flippers. The garden is a loop you keep.',
      'A crystalline blossom crown, drifting snow petals. Cold, kept kind.')),
    ('niblet', 'cacaocrest', 'canopycacao', 'grove', (56, 98, 154), 0.54,
     ('Pod-Mark Companion', 'Pod-Guard Companion', 'Canopy-Pod Guardian Companion'),
     ('A tiny monkey with a cacao-pod mark and a leaf cap. Shade is the point.',
      'Nimble climber, pod-shaped forearm guards. Highlands are a ladder.',
      'Bark mantle, pod ornaments, leafy crown. The canopy holds.')),
    ('siltip', 'marshcoil', 'estuaryn', 'tide', (56, 98, 152), 0.54,
     ('Eelgrass Otter Companion', 'Ribbon-Mane Companion', 'Estuary Guardian Companion'),
     ('A small otter with eelgrass whiskers. Causeways are its favourite joke.',
      'Long swimmer, ribbon-grass mane. Flats reward a steady stroke.',
      'Eelgrass cloak, tidal-patterned fur. The mouth of the river, kept.')),
    ('mistyak', 'cloudyak', 'skyburden', 'wind', (70, 114, 172), 0.42,
     ('Mist-Bang Companion', 'Cloud-Fleece Companion', 'Cloudbank Guardian Companion'),
     ('A shaggy calf with misty bangs. Above the sunline it still walks.',
      'Larger, cloud fleece, blue horn tips. Peaks are just more trail.',
      'A rolling cloudbank on its shoulders. Height you earned.')),
    ('twigglypt', 'ringback', 'chronotree', 'grove', (62, 106, 162), 0.48,
     ('Wood-Scale Companion', 'Growth-Ring Companion', 'Petrified-Scale Guardian Companion'),
     ('A tiny pangolin with wooden scales. Rings are already in it.',
      'Longer armor, visible growth rings. The grove keeps a calendar.',
      'Massive petrified-wood scales. Seasons, recorded by walking them.')),
    ('glyphish', 'runefin', 'tideglyph', 'tide', (58, 100, 156), 0.50,
     ('Rune-Shell Companion', 'Articulated-Fin Companion', 'Spiral-Glyph Guardian Companion'),
     ('A small nautilus with softly glowing shell symbols. Arches of bubble suit it.',
      'Articulated fins, a rotating rune shell. Ruins are a map, not a maze.',
      'A monumental spiral covered in tidal glyphs. Depth, practiced.')),
    ('knockit', 'bamboar', 'canebrute', 'grove', (66, 110, 168), 0.46,
     ('Hollow-Tusk Companion', 'Cane-Armor Companion', 'Bamboo-Tusk Guardian Companion'),
     ('A piglet with hollow bamboo tusk buds. Stems knock when you pass.',
      'Lean boar, segmented cane armor. The ravine is a corridor you keep.',
      'Towering bamboo tusks, rustling spine-stalks. Hollow, not empty.')),
    ('pepkit', 'capsiclaw', 'scovlion', 'ember', (58, 102, 160), 0.50,
     ('Pepper-Tuft Companion', 'Petal-Ruff Companion', 'Botanical-Mane Guardian Companion'),
     ('A tiny cat with a red pepper tuft-tail. Spice-wind makes it sneeze, then grin.',
      'Young lion, layered pepper-petal ruff. Savanna is a heat you walk through.',
      'A botanical mane of pepper forms. Energetic, never cruel.')),
    ('pebbloom', 'selencore', 'moonvault', 'stone', (64, 108, 166), 0.46,
     ('Gem-Nose Companion', 'Moonstone-Claw Companion', 'Tunnel-Map Guardian Companion'),
     ('A tiny mole with a luminous gem nose. Echoes are how it says hello.',
      'Moonstone claws, shoulder crystals. Caverns are rooms, not holes.',
      'Arched moonstone armor, glowing tunnel-map markings. Underground, kept.')),
    ('lotuslet', 'bloomnewt', 'lotosaur', 'rest', (56, 98, 152), 0.54,
     ('Lotus-Bud Companion', 'Petal-Gill Companion', 'Lotus-Pond Guardian Companion'),
     ('A tiny newt with a lotus bud on its head. Petalwater is a path, not a bath.',
      'Longer, open lotus crest, petal gills. The delta is a maze you walk.',
      'A blooming lotus pond on its back. Peace is the work of returning.')),
    ('kernelit', 'millwing', 'harvestail', 'wind', (50, 90, 144), 0.60,
     ('Pinwheel-Moth Companion', 'Grain-Wing Companion', 'Windmill-Wing Guardian Companion'),
     ('A grain-kernel moth with pinwheel wings. Roads between mills suit it.',
      'Four broad grain-veined wings. Plains are for crossing in daylight.',
      'Windmill-like wings, wheat-tail streamers. Harvest is a pace.')),
    ('conecko', 'barkglide', 'redwoodrake', 'grove', (54, 96, 150), 0.56,
     ('Cone-Toe Companion', 'Bark-Membrane Companion', 'Sail-Frond Guardian Companion'),
     ('A tiny gecko with bark-pattern skin and cone toes. Giant steps are still steps.',
      'Glider, redwood-bark membranes. The crown is a trail above the trail.',
      'Immense bark-red sails, a fern-fringed tail. Height, held gently.')),
    ('bloopot', 'vaportoise', 'geyshell', 'ember', (66, 110, 168), 0.46,
     ('Bubble-Vent Companion', 'Terrace-Shell Companion', 'Geyser-Basin Guardian Companion'),
     ('A round tortoise with warm-water vents. Steamstone walks fog its glasses.',
      'Mineral terraces on the shell. The basin is a circuit of heat.',
      'A miniature geyser basin for a shell, steam plumes and all.')),
    ('figbat', 'orchardusk', 'noctifera', 'rest', (52, 92, 146), 0.58,
     ('Fig-Body Companion', 'Seed-Speck Companion', 'Fig-Leaf Guardian Companion'),
     ('A tiny bat with a fig-shaped body and leaf ears. Starlit paths wake it.',
      'Sleek fruit-bat, purple membranes, seed-speckled chest. Night orchard.',
      'Fig-leaf mantle, star-speckled wings. Dark, kept kind.')),
    ('ammonip', 'spiralisk', 'aeoncoil', 'stone', (60, 104, 162), 0.48,
     ('Fossil-Spiral Companion', 'Segmented-Coil Companion', 'Sand-Sail Guardian Companion'),
     ('A small fossil spiral on tiny feet. Currents of sand are still currents.',
      'Upright, segmented spiral armor. The desert keeps old maps.',
      'An enormous ammonite coil, sand-sail fins, fossil ridges. Time, walked.')),
    ('tinkid', 'alpengait', 'summitbell', 'wind', (56, 98, 154), 0.54,
     ('Flower-Bell Companion', 'Ankle-Bell Companion', 'Horn-Bloom Guardian Companion'),
     ('A tiny antelope kid with flower-bell ear tips. Ascent is a song it knows.',
      'Nimble, floral ankle bells, curved horns. Meadows above the tree line.',
      'Sweeping horn arcs draped in alpine bellflowers. The summit stays.')),
]


def title(s):
    return s[:1].upper() + s[1:]


# ---------------------------------------------------------------------------
# Pixel canvas
# ---------------------------------------------------------------------------
def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def hexrgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


class Pix:
    def __init__(self, w=SIZE, h=SIZE):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]

    def set(self, x, y, rgb):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = rgb

    def filled(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h and self.px[y][x] is not None

    def ellipse(self, cx, cy, rx, ry, dark, light, squash=1.0):
        lx, ly, lz = -0.55, -0.68, 0.48
        n = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / n, ly / n, lz / n
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                u = (x + 0.5 - cx) / rx
                v = (y + 0.5 - cy) / ry
                d = u * u + v * v
                if d > 1.0:
                    continue
                nz = math.sqrt(max(0.0, 1.0 - d)) * squash
                lam = max(0.0, u * lx + v * ly + nz * lz)
                shade = 0.22 + 0.78 * lam
                band = int(shade * 4.999)
                t = (band + 0.5) / 5.0
                self.set(x, y, mix(dark, light, t))

    def capsule(self, x0, y0, x1, y1, r0, r1, dark, light):
        dx, dy = x1 - x0, y1 - y0
        seg2 = dx * dx + dy * dy or 1.0
        rmax = max(r0, r1)
        lx, ly, lz = -0.55, -0.68, 0.48
        n = math.sqrt(lx * lx + ly * ly + lz * lz)
        lx, ly, lz = lx / n, ly / n, lz / n
        for y in range(int(min(y0, y1) - rmax) - 1, int(max(y0, y1) + rmax) + 2):
            for x in range(int(min(x0, x1) - rmax) - 1, int(max(x0, x1) + rmax) + 2):
                t = max(0.0, min(1.0, ((x - x0) * dx + (y - y0) * dy) / seg2))
                cx, cy = x0 + dx * t, y0 + dy * t
                r = r0 + (r1 - r0) * t
                if r <= 0:
                    continue
                ox, oy = x - cx, y - cy
                d = math.sqrt(ox * ox + oy * oy)
                if d > r:
                    continue
                u, v = ox / r, oy / r
                nz = math.sqrt(max(0.0, 1.0 - (d / r) ** 2))
                lam = max(0.0, u * lx + v * ly + nz * lz)
                shade = 0.22 + 0.78 * lam
                band = int(shade * 4.999)
                self.set(x, y, mix(dark, light, (band + 0.5) / 5.0))

    def poly(self, pts, dark, light, lift=0.45):
        ys = [p[1] for p in pts]
        xs = [p[0] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            hits = []
            for i in range(len(pts)):
                (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
                if (y0 <= y < y1) or (y1 <= y < y0):
                    hits.append(x0 + (y - y0) * (x1 - x0) / float(y1 - y0 or 1))
            hits.sort()
            for i in range(0, len(hits) - 1, 2):
                x0, x1 = hits[i], hits[i + 1]
                span = max(1.0, x1 - x0)
                for x in range(int(x0), int(x1) + 1):
                    t = (x - x0) / span
                    # left-lit flat
                    shade = lift + 0.4 * (1.0 - t) + 0.1 * ((max(ys) - y) / (max(ys) - min(ys) or 1))
                    band = int(max(0.0, min(0.99, shade)) * 4.999)
                    self.set(int(x), y, mix(dark, light, (band + 0.5) / 5.0))

    def crescent(self, cx, cy, rx, ry, dark, light, cut=(0.35, 0.0)):
        self.ellipse(cx, cy, rx, ry, dark, light)
        ox, oy = cut
        for y in range(self.h):
            for x in range(self.w):
                u = (x + 0.5 - (cx + ox * rx)) / (rx * 0.72)
                v = (y + 0.5 - (cy + oy * ry)) / (ry * 0.72)
                if u * u + v * v <= 1.0 and self.filled(x, y):
                    # punch a hole only if we are inside the crescent source
                    u0 = (x + 0.5 - cx) / rx
                    v0 = (y + 0.5 - cy) / ry
                    if u0 * u0 + v0 * v0 <= 1.0:
                        self.px[y][x] = None

    def face(self, cx, cy, s=1.0):
        # huge shiny eyes — first-rendition type, not angry lids
        w, h = int(6 * s), int(7 * s)
        for ey, ex in ((-int(7 * s), -int(6 * s)), (-int(7 * s), int(6 * s))):
            self.ellipse(cx + ex, cy + ey, w, h, (250, 250, 255), (255, 255, 255))
            self.ellipse(cx + ex + int(s), cy + ey + int(s), int(3.2 * s), int(3.8 * s), (20, 16, 36), (40, 32, 60))
            self.set(cx + ex - int(1.4 * s), cy + ey - int(1.6 * s), (255, 255, 255))
            self.set(cx + ex - int(1.4 * s) + 1, cy + ey - int(1.6 * s), (255, 255, 255))
            self.set(cx + ex - int(1.4 * s), cy + ey - int(1.6 * s) + 1, (255, 255, 255))

    def outline(self, ink):
        edge = []
        for y in range(self.h):
            for x in range(self.w):
                if self.filled(x, y):
                    continue
                near = any(self.filled(x + dx, y + dy)
                           for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
                if near:
                    edge.append((x, y))
        for x, y in edge:
            self.set(x, y, ink)

    def save(self, path):
        try:
            from PIL import Image
        except ImportError:
            raise SystemExit('Pillow required: pip install -r tools/requirements.txt')
        im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        put = im.putpixel
        for y in range(self.h):
            for x in range(self.w):
                c = self.px[y][x]
                if c is not None:
                    put((x, y), (c[0], c[1], c[2], 255))
        im.save(path)


# ---------------------------------------------------------------------------
# Stage silhouettes — each family uses a unique trio
# ---------------------------------------------------------------------------
def pal_of(root):
    (bd, bl), (ad, al), (yd, yl) = PALS[root]
    return hexrgb(bd), hexrgb(bl), hexrgb(ad), hexrgb(al), hexrgb(yd), hexrgb(yl)


def finish(p, body_dark):
    p.outline(mix(body_dark, (12, 10, 20), 0.55))
    return p


# Baby templates: compact, low, simple. Adult templates: new silhouette.
def baby_shell(p, bd, bl, ad, al, yd, yl, extra='nubs'):
    p.ellipse(96, 128, 40, 34, bd, bl)
    p.ellipse(96, 138, 22, 16, yd, yl)
    p.ellipse(70, 108, 16, 14, ad, al)  # facet / ear
    p.ellipse(122, 108, 16, 14, ad, al)
    if extra == 'nubs':
        for x in (62, 80, 112, 130):
            p.ellipse(x, 158, 7, 8, ad, al)
    elif extra == 'feet':
        p.capsule(78, 154, 70, 176, 6, 5, ad, al)
        p.capsule(114, 154, 122, 176, 6, 5, ad, al)
    elif extra == 'tuft':
        p.poly([(96, 78), (86, 108), (106, 108)], ad, al)
    p.face(96, 124, 1.05)
    return finish(p, bd)


def baby_quad(p, bd, bl, ad, al, yd, yl, extra='horns'):
    p.ellipse(100, 132, 36, 24, bd, bl)          # body
    p.ellipse(70, 118, 20, 18, bd, bl)           # head forward
    p.ellipse(66, 124, 10, 8, yd, yl)
    p.capsule(84, 148, 76, 174, 7, 5, bd, bl)
    p.capsule(118, 148, 128, 174, 7, 5, bd, bl)
    if extra == 'horns':
        p.poly([(62, 102), (56, 78), (68, 100)], ad, al)
        p.poly([(78, 100), (80, 76), (86, 102)], ad, al)
    elif extra == 'ears':
        p.ellipse(56, 100, 8, 14, ad, al)
        p.ellipse(82, 98, 8, 14, ad, al)
    elif extra == 'sail':
        p.poly([(100, 100), (132, 70), (118, 118)], ad, al, lift=0.6)
    p.face(66, 114, 0.95)
    return finish(p, bd)


def baby_bird(p, bd, bl, ad, al, yd, yl, extra='crest'):
    p.ellipse(96, 136, 28, 24, bd, bl)
    p.ellipse(96, 108, 20, 18, bd, bl)
    p.ellipse(96, 142, 14, 10, yd, yl)
    p.poly([(118, 128), (150, 118), (122, 146)], ad, al)  # wing
    if extra == 'crest':
        p.poly([(96, 80), (88, 108), (104, 108)], al, ad)
    elif extra == 'ember':
        p.capsule(124, 100, 148, 70, 4, 3, ad, al)
    p.face(96, 106, 0.9)
    return finish(p, bd)


def baby_bug(p, bd, bl, ad, al, yd, yl, extra='wings'):
    p.ellipse(96, 140, 18, 22, bd, bl)
    p.ellipse(96, 118, 14, 12, bd, bl)
    if extra == 'wings':
        p.poly([(80, 124), (50, 96), (78, 140)], ad, al, lift=0.7)
        p.poly([(112, 124), (142, 96), (114, 140)], ad, al, lift=0.7)
    elif extra == 'pinwheel':
        for ang in (0, 90, 180, 270):
            rad = math.radians(ang)
            p.capsule(96, 118, 96 + 28 * math.cos(rad), 118 + 28 * math.sin(rad), 5, 3, ad, al)
    p.face(96, 116, 0.8)
    return finish(p, bd)


def teen_upright(p, bd, bl, ad, al, yd, yl, extra='arms'):
    p.ellipse(96, 118, 28, 36, bd, bl)           # torso
    p.ellipse(96, 70, 22, 20, bd, bl)            # head
    p.ellipse(96, 128, 16, 18, yd, yl)
    p.capsule(84, 148, 70, 186, 8, 6, bd, bl)
    p.capsule(108, 148, 122, 186, 8, 6, bd, bl)
    if extra == 'arms':
        p.capsule(74, 110, 48, 140, 7, 5, bd, bl)
        p.capsule(118, 110, 144, 140, 7, 5, bd, bl)
    elif extra == 'antlers':
        p.poly([(80, 54), (58, 24), (86, 58)], ad, al)
        p.poly([(112, 54), (134, 24), (106, 58)], ad, al)
    elif extra == 'wings':
        p.poly([(70, 100), (20, 70), (68, 130)], ad, al, lift=0.65)
        p.poly([(122, 100), (172, 70), (124, 130)], ad, al, lift=0.65)
    p.face(96, 68, 1.0)
    return finish(p, bd)


def teen_long(p, bd, bl, ad, al, yd, yl, extra='fins'):
    p.ellipse(108, 128, 50, 22, bd, bl)          # long body
    p.ellipse(58, 118, 22, 18, bd, bl)           # head
    p.ellipse(70, 132, 14, 10, yd, yl)
    p.capsule(90, 146, 80, 178, 6, 5, bd, bl)
    p.capsule(130, 146, 142, 176, 6, 5, bd, bl)
    if extra == 'fins':
        p.poly([(108, 104), (124, 70), (132, 110)], ad, al)
        p.poly([(90, 108), (78, 74), (100, 112)], ad, al)
    elif extra == 'mane':
        p.capsule(90, 108, 40, 90, 8, 4, ad, al)
        p.capsule(100, 104, 56, 70, 7, 4, ad, al)
    elif extra == 'sail':
        p.poly([(100, 108), (160, 48), (140, 128)], ad, al, lift=0.7)
    p.face(54, 114, 0.95)
    return finish(p, bd)


def teen_flyer(p, bd, bl, ad, al, yd, yl, extra='longwing'):
    p.ellipse(96, 120, 22, 18, bd, bl)
    p.ellipse(96, 100, 16, 14, bd, bl)
    if extra == 'longwing':
        p.poly([(80, 116), (8, 90), (78, 132)], ad, al, lift=0.6)
        p.poly([(112, 116), (184, 90), (114, 132)], ad, al, lift=0.6)
    elif extra == 'four':
        p.poly([(80, 108), (24, 70), (78, 122)], ad, al, lift=0.65)
        p.poly([(112, 108), (168, 70), (114, 122)], ad, al, lift=0.65)
        p.poly([(82, 124), (36, 150), (86, 136)], ad, al, lift=0.55)
        p.poly([(110, 124), (156, 150), (106, 136)], ad, al, lift=0.55)
    p.capsule(96, 134, 96, 168, 5, 3, bd, bl)
    p.face(96, 98, 0.85)
    return finish(p, bd)


def adult_crown(p, bd, bl, ad, al, yd, yl, extra='crown'):
    p.ellipse(96, 130, 40, 42, bd, bl)           # massive body
    p.ellipse(96, 78, 26, 24, bd, bl)
    p.ellipse(96, 140, 22, 20, yd, yl)
    p.capsule(74, 164, 58, 188, 10, 8, bd, bl)
    p.capsule(118, 164, 134, 188, 10, 8, bd, bl)
    if extra == 'crown':
        for x, h in ((70, 28), (96, 8), (122, 28)):
            p.poly([(x - 10, 58), (x, h), (x + 10, 58)], ad, al)
    elif extra == 'antlers':
        p.poly([(78, 58), (40, 16), (50, 40), (84, 62)], ad, al)
        p.poly([(114, 58), (152, 16), (142, 40), (108, 62)], ad, al)
        p.poly([(50, 28), (28, 8), (56, 34)], ad, al)
        p.poly([(142, 28), (164, 8), (136, 34)], ad, al)
    elif extra == 'grove':
        p.ellipse(70, 48, 18, 22, ad, al)
        p.ellipse(96, 36, 20, 24, ad, al)
        p.ellipse(122, 48, 18, 22, ad, al)
        p.capsule(96, 58, 96, 78, 6, 6, bd, bl)
    p.capsule(60, 120, 28, 100, 8, 6, bd, bl)
    p.capsule(132, 120, 164, 100, 8, 6, bd, bl)
    p.face(96, 76, 1.15)
    return finish(p, bd)


def adult_wide(p, bd, bl, ad, al, yd, yl, extra='mantle'):
    p.ellipse(96, 140, 56, 30, bd, bl)           # broad low body
    p.ellipse(60, 118, 24, 20, bd, bl)
    p.ellipse(58, 124, 12, 9, yd, yl)
    p.capsule(80, 162, 64, 186, 9, 7, bd, bl)
    p.capsule(130, 162, 150, 186, 9, 7, bd, bl)
    if extra == 'mantle':
        p.poly([(40, 90), (96, 40), (152, 90), (130, 128), (62, 128)], ad, al, lift=0.55)
    elif extra == 'sails':
        p.poly([(96, 70), (20, 20), (70, 120)], ad, al, lift=0.7)
        p.poly([(96, 70), (172, 20), (122, 120)], ad, al, lift=0.7)
    elif extra == 'wings':
        p.poly([(70, 110), (4, 40), (60, 150)], ad, al, lift=0.5)
        p.poly([(122, 110), (188, 40), (132, 150)], ad, al, lift=0.5)
    p.face(56, 114, 1.05)
    return finish(p, bd)


def adult_tower(p, bd, bl, ad, al, yd, yl, extra='spire'):
    p.poly([(70, 180), (50, 90), (96, 40), (142, 90), (122, 180)], bd, bl, lift=0.4)
    p.ellipse(96, 88, 22, 20, bd, bl)
    p.ellipse(96, 150, 18, 16, yd, yl)
    if extra == 'spire':
        p.poly([(96, 8), (80, 50), (112, 50)], ad, al)
    elif extra == 'coil':
        p.ellipse(130, 70, 28, 36, ad, al)
        p.ellipse(138, 70, 14, 20, yd, yl)
    elif extra == 'bells':
        for x in (60, 96, 132):
            p.ellipse(x, 48, 12, 16, ad, al)
            p.capsule(x, 62, x, 78, 3, 3, bd, bl)
    p.face(96, 86, 1.1)
    return finish(p, bd)


# root -> (baby_fn, baby_extra, teen_fn, teen_extra, adult_fn, adult_extra)
BUILDS = {
    'brineling':  (baby_shell, 'nubs', teen_upright, 'arms', adult_crown, 'crown'),
    'dusthorn':   (baby_quad, 'horns', teen_long, 'fins', adult_wide, 'mantle'),
    'mireblink':  (baby_shell, 'feet', teen_upright, 'arms', adult_crown, 'grove'),
    'pinepuff':   (baby_shell, 'tuft', teen_upright, 'antlers', adult_crown, 'antlers'),
    'clinket':    (baby_quad, 'ears', teen_long, 'fins', adult_tower, 'bells'),
    'glintfoal':  (baby_quad, 'tuft' if False else 'horns', teen_long, 'mane', adult_wide, 'mantle'),
    'propfin':    (baby_shell, 'nubs', teen_long, 'fins', adult_crown, 'grove'),
    'zapram':     (baby_quad, 'horns', teen_upright, 'antlers', adult_crown, 'antlers'),
    'nectlet':    (baby_quad, 'ears', teen_upright, 'wings', adult_crown, 'antlers'),
    'chipmagma':  (baby_quad, 'sail', teen_long, 'fins', adult_wide, 'sails'),
    'bellbun':    (baby_shell, 'tuft', teen_upright, 'arms', adult_wide, 'mantle'),
    'nailnut':    (baby_shell, 'tuft', teen_upright, 'antlers', adult_crown, 'antlers'),
    'pipolyp':    (baby_shell, 'nubs', teen_upright, 'arms', adult_crown, 'crown'),
    'veilisk':    (baby_quad, 'sail', teen_long, 'sail', adult_wide, 'sails'),
    'plinkbat':   (baby_bird, 'crest', teen_flyer, 'longwing', adult_wide, 'wings'),
    'burrcalf':   (baby_quad, 'horns', teen_long, 'mane', adult_wide, 'mantle'),
    'prismink':   (baby_quad, 'sail', teen_long, 'mane', adult_wide, 'mantle'),
    'kneebit':    (baby_shell, 'nubs', teen_upright, 'arms', adult_crown, 'grove'),
    'mumblewool': (baby_shell, 'tuft', teen_upright, 'antlers', adult_crown, 'antlers'),
    'skiprock':   (baby_shell, 'feet', teen_long, 'fins', adult_wide, 'mantle'),
    'glimrice':   (baby_bird, 'crest', teen_flyer, 'longwing', adult_wide, 'wings'),
    'roseling':   (baby_quad, 'horns', teen_upright, 'antlers', adult_crown, 'antlers'),
    'wicklet':    (baby_bug, 'wings', teen_flyer, 'longwing', adult_wide, 'wings'),
    'sootfinch':  (baby_bird, 'ember', teen_flyer, 'longwing', adult_wide, 'wings'),
    'budice':     (baby_shell, 'tuft', teen_upright, 'arms', adult_crown, 'crown'),
    'niblet':     (baby_quad, 'ears', teen_upright, 'arms', adult_crown, 'grove'),
    'siltip':     (baby_quad, 'ears', teen_long, 'mane', adult_wide, 'mantle'),
    'mistyak':    (baby_quad, 'horns', teen_long, 'mane', adult_wide, 'mantle'),
    'twigglypt':  (baby_shell, 'nubs', teen_long, 'fins', adult_tower, 'coil'),
    'glyphish':   (baby_shell, 'nubs', teen_long, 'fins', adult_tower, 'coil'),
    'knockit':    (baby_quad, 'horns', teen_long, 'fins', adult_crown, 'antlers'),
    'pepkit':     (baby_quad, 'ears', teen_upright, 'arms', adult_crown, 'mane' if False else 'crown'),
    'pebbloom':   (baby_shell, 'feet', teen_upright, 'arms', adult_tower, 'spire'),
    'lotuslet':   (baby_quad, 'sail', teen_long, 'fins', adult_crown, 'grove'),
    'kernelit':   (baby_bug, 'pinwheel', teen_flyer, 'four', adult_wide, 'wings'),
    'conecko':    (baby_quad, 'sail', teen_long, 'sail', adult_wide, 'sails'),
    'bloopot':    (baby_shell, 'nubs', teen_upright, 'arms', adult_crown, 'crown'),
    'figbat':     (baby_shell, 'tuft', teen_flyer, 'longwing', adult_wide, 'wings'),
    'ammonip':    (baby_shell, 'feet', teen_upright, 'arms', adult_tower, 'coil'),
    'tinkid':     (baby_quad, 'ears', teen_upright, 'antlers', adult_crown, 'antlers'),
}


def draw_stage(root, stage):
    bd, bl, ad, al, yd, yl = pal_of(root)
    p = Pix()
    baby_fn, baby_x, teen_fn, teen_x, adult_fn, adult_x = BUILDS[root]
    if stage == 1:
        return baby_fn(p, bd, bl, ad, al, yd, yl, baby_x)
    if stage == 2:
        return teen_fn(p, bd, bl, ad, al, yd, yl, teen_x)
    return adult_fn(p, bd, bl, ad, al, yd, yl, adult_x)


def all_ids():
    out = []
    for root, mid, adult, *_ in FAMILIES:
        out.append((root, root, 1))
        out.append((root, mid, 2))
        out.append((root, adult, 3))
    return out


def emit_js(path):
    lines = [
        '// AUTO-GENERATED by tools/horizon_kit.py — horizon companion roster.',
        '// Ids are permanent. Do not rename. Art masters are interim until',
        '// first-rendition plates arrive; do not invent a master from JSON.',
        '',
        'export const HORIZON_CREATURES = {',
    ]
    for root, mid, adult, typ, hps, catch, species, flavors in FAMILIES:
        ids = (root, mid, adult)
        evo = (mid, adult, None)
        lv = (5, 14, None)
        pts = (30, 110, None)
        kind = ('wild', 'evolution', 'evolution')
        scale = (None, 1.18, 1.32)
        for i in range(3):
            cid = ids[i]
            pal = 'art_' + cid
            lines.append(f'  {cid}: {{')
            lines.append(f"    id: '{cid}', stage: {i + 1}, name: '{title(cid)}', sprite: '{cid}', palette: '{pal}',")
            extra = ''
            if i == 0:
                extra = f", catchable: true, catchRate: {catch:.2f}"
            else:
                extra = f', scale: {scale[i]}, catchable: false'
            lines.append(
                f"    species: '{species[i]}', kind: '{kind[i]}', type: '{typ}', "
                f"baseHp: {hps[i]}{extra},"
            )
            ev = evo[i]
            if ev:
                lines.append(f"    flavor: '{flavors[i].replace(chr(39), chr(92)+chr(39))}',")
                lines.append(f"    evolvesTo: '{ev}', evolveLevel: {lv[i]}, evolvePoints: {pts[i]},")
            else:
                lines.append(f"    flavor: '{flavors[i].replace(chr(39), chr(92)+chr(39))}',")
                lines.append('    evolvesTo: null,')
            lines.append('  },')
    lines.append('};')
    lines.append('')
    roots = ', '.join(f"'{f[0]}'" for f in FAMILIES)
    lines.append(f'export const HORIZON_COMPANION_IDS = [{roots}];')
    lines.append('')
    lines.append('export default HORIZON_CREATURES;')
    lines.append('')
    text = '\n'.join(lines)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print('wrote', path, '(%d families)' % len(FAMILIES))


def draw_all():
    os.makedirs(ART, exist_ok=True)
    for root, cid, stage in all_ids():
        p = draw_stage(root, stage)
        out = os.path.join(ART, cid + '.png')
        p.save(out)
        print('drew', os.path.relpath(out, ROOT))


def convert_all():
    for _root, cid, _stage in all_ids():
        src = os.path.join(ART, cid + '.png')
        dst = os.path.join(HERE, 'traced_%s.json' % cid)
        r = subprocess.run([sys.executable, os.path.join(HERE, 'convert_reference.py'), src, dst],
                           capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit('convert failed for %s: %s' % (cid, r.stderr.strip() or r.stdout.strip()))
        print(r.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--emit-js', action='store_true')
    ap.add_argument('--draw', action='store_true')
    ap.add_argument('--convert', action='store_true')
    args = ap.parse_args()
    if not (args.emit_js or args.draw or args.convert):
        args.emit_js = args.draw = args.convert = True
    if args.emit_js:
        emit_js(os.path.join(ROOT, 'src', 'data', 'horizonCreatures.js'))
    if args.draw:
        draw_all()
    if args.convert:
        convert_all()


if __name__ == '__main__':
    main()
