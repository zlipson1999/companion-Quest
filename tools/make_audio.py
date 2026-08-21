#!/usr/bin/env python3
"""Generate original 8-bit chiptune SFX for Companion Quest.

Square / triangle / noise synthesis -> small mono WAV files in assets/sfx/.
All original audio; no copied music. Re-run to regenerate.
"""
import os, struct, math, random

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "sfx")
os.makedirs(OUT, exist_ok=True)

SR = 22050  # sample rate

NOTES = {
    "E3": 164.81, "F3": 174.61, "G3": 196.00, "A3": 220.00, "B3": 246.94,
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00,
    "A4": 440.00, "B4": 493.88, "C5": 523.25, "D5": 587.33, "E5": 659.25,
    "F5": 698.46, "G5": 783.99, "A5": 880.00, "B5": 987.77, "C6": 1046.50,
    "D6": 1174.66, "E6": 1318.51, "G6": 1567.98,
}


def square(t, f, duty=0.5):
    return 1.0 if (t * f) % 1.0 < duty else -1.0


def triangle(t, f):
    p = (t * f) % 1.0
    return 4 * abs(p - 0.5) - 1.0


def env(i, n, attack=0.01, release=0.25):
    a = int(n * attack)
    r = int(n * release)
    if i < a:
        return i / max(1, a)
    if i > n - r:
        return max(0.0, (n - i) / max(1, r))
    return 1.0


def tone(freq, dur, vol=0.5, wave="square", duty=0.5, attack=0.01, release=0.3):
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        if wave == "square":
            s = square(t, freq, duty)
        elif wave == "triangle":
            s = triangle(t, freq)
        elif wave == "noise":
            s = random.uniform(-1, 1)
        else:
            s = math.sin(2 * math.pi * freq * t)
        out.append(s * vol * env(i, n, attack, release))
    return out


def silence(dur):
    return [0.0] * int(SR * dur)


def seq(parts):
    out = []
    for p in parts:
        out.extend(p)
    return out


def write_wav(name, samples):
    path = os.path.join(OUT, name)
    data = bytearray()
    for s in samples:
        v = max(-1.0, min(1.0, s))
        data += struct.pack("<h", int(v * 32767))
    n = len(samples)
    with open(path, "wb") as f:
        f.write(b"RIFF")
        f.write(struct.pack("<I", 36 + len(data)))
        f.write(b"WAVE")
        f.write(b"fmt ")
        f.write(struct.pack("<IHHIIHH", 16, 1, 1, SR, SR * 2, 2, 16))
        f.write(b"data")
        f.write(struct.pack("<I", len(data)))
        f.write(bytes(data))
    print(f"  wrote {name} ({n/SR:.2f}s)")


def n(name):
    return NOTES[name]


def voice(track, bpm, vol, wave="square", duty=0.5):
    beat = 60.0 / bpm
    out = []
    for name, beats in track:
        dur = beat * beats
        if name is None:
            out.extend(silence(dur))
        else:
            out.extend(tone(NOTES[name], dur, vol=vol, wave=wave, duty=duty,
                            attack=0.02, release=0.12))
    return out


def mix(*tracks):
    L = max(len(t) for t in tracks)
    out = []
    for i in range(L):
        s = 0.0
        for t in tracks:
            if i < len(t):
                s += t[i]
        out.append(max(-1.0, min(1.0, s)))
    return out


def build():
    write_wav("blip.wav", tone(n("C6"), 0.035, vol=0.18, wave="square", duty=0.25, release=0.6))
    write_wav("cursor.wav", seq([
        tone(n("E5"), 0.03, vol=0.3, release=0.4),
        tone(n("A5"), 0.04, vol=0.3, release=0.5),
    ]))
    write_wav("confirm.wav", seq([
        tone(n("C5"), 0.06, vol=0.35),
        tone(n("G5"), 0.10, vol=0.35),
    ]))
    write_wav("cancel.wav", seq([
        tone(n("G4"), 0.05, vol=0.32, duty=0.25),
        tone(n("C4"), 0.09, vol=0.32, duty=0.25),
    ]))

    write_wav("encounter.wav", seq([
        tone(n("C5"), 0.07, vol=0.4, duty=0.5),
        tone(n("F5"), 0.07, vol=0.4, duty=0.5),
        tone(n("C5"), 0.07, vol=0.4, duty=0.5),
        tone(n("F5"), 0.07, vol=0.4, duty=0.5),
        tone(n("G5"), 0.16, vol=0.42, duty=0.5),
    ]))
    noise = tone(0, 0.10, vol=0.35, wave="noise", release=0.6)
    low = tone(110, 0.12, vol=0.4, wave="square", duty=0.5, release=0.5)
    L = max(len(noise), len(low))
    mixed = []
    for i in range(L):
        a = noise[i] if i < len(noise) else 0
        b = low[i] if i < len(low) else 0
        mixed.append(max(-1, min(1, a + b)))
    write_wav("hit.wav", mixed)
    write_wav("lowhp.wav", seq([
        tone(n("A5"), 0.08, vol=0.4, wave="square", duty=0.5, release=0.2),
        silence(0.05),
        tone(n("A5"), 0.08, vol=0.4, wave="square", duty=0.5, release=0.2),
    ]))
    write_wav("victory.wav", seq([
        tone(n("C5"), 0.10, vol=0.4),
        tone(n("E5"), 0.10, vol=0.4),
        tone(n("G5"), 0.10, vol=0.4),
        tone(n("C6"), 0.28, vol=0.45),
    ]))

    write_wav("levelup.wav", seq([
        tone(n("E5"), 0.08, vol=0.4, wave="triangle"),
        tone(n("G5"), 0.08, vol=0.4, wave="triangle"),
        tone(n("C6"), 0.08, vol=0.4, wave="triangle"),
        tone(n("E6"), 0.26, vol=0.45, wave="triangle"),
    ]))
    write_wav("evolve.wav", seq([
        tone(n("C5"), 0.12, vol=0.38, wave="triangle"),
        tone(n("E5"), 0.12, vol=0.38, wave="triangle"),
        tone(n("G5"), 0.12, vol=0.38, wave="triangle"),
        tone(n("C6"), 0.12, vol=0.40, wave="triangle"),
        tone(n("E6"), 0.12, vol=0.40, wave="triangle"),
        tone(n("G6"), 0.45, vol=0.45, wave="triangle"),
    ]))
    write_wav("item.wav", seq([
        tone(n("G5"), 0.05, vol=0.35),
        tone(n("C6"), 0.10, vol=0.38),
    ]))
    write_wav("heal.wav", seq([
        tone(n("C5"), 0.10, vol=0.3, wave="triangle"),
        tone(n("E5"), 0.10, vol=0.3, wave="triangle"),
        tone(n("G5"), 0.10, vol=0.3, wave="triangle"),
        tone(n("C6"), 0.10, vol=0.3, wave="triangle"),
        tone(n("G5"), 0.22, vol=0.3, wave="triangle"),
    ]))
    write_wav("milestone.wav", seq([
        tone(n("C5"), 0.05, vol=0.32),
        tone(n("E5"), 0.05, vol=0.32),
        tone(n("G5"), 0.12, vol=0.34),
    ]))
    # catch success chime
    write_wav("catch.wav", seq([
        tone(n("G5"), 0.07, vol=0.36),
        tone(n("B5"), 0.07, vol=0.36),
        tone(n("D6"), 0.07, vol=0.36),
        tone(n("G6"), 0.24, vol=0.42),
    ]))

    build_bgm()


def build_bgm():
    bpm = 104
    town_lead = voice([
        ("C5", 1), ("E5", 1), ("G5", 2),
        ("A5", 1), ("G5", 1), ("E5", 2),
        ("F5", 1), ("E5", 1), ("D5", 2),
        ("G4", 1), ("B4", 1), ("C5", 2),
    ], bpm, vol=0.16, wave="square", duty=0.5)
    town_bass = voice([
        ("C4", 1), ("C4", 1), ("G3", 1), ("G3", 1),
        ("A3", 1), ("A3", 1), ("E3", 1), ("E3", 1),
        ("F3", 1), ("F3", 1), ("C4", 1), ("C4", 1),
        ("G3", 1), ("G3", 1), ("G3", 1), ("B3", 1),
    ], bpm, vol=0.14, wave="triangle")
    write_wav("bgm_town.wav", mix(town_lead, town_bass))

    bpm = 152
    bt_lead = voice([
        ("A5", 1), ("C6", 1), ("E6", 1), ("C6", 1),
        ("G5", 1), ("A5", 1), ("G5", 1), ("E5", 1),
        ("F5", 1), ("A5", 1), ("C6", 1), ("A5", 1),
        ("E5", 1), ("G5", 1), ("E5", 1), (None, 1),
    ], bpm, vol=0.15, wave="square", duty=0.5)
    bt_bass = voice([
        ("A3", 1), ("A3", 1), ("A3", 1), ("A3", 1),
        ("G3", 1), ("G3", 1), ("G3", 1), ("G3", 1),
        ("F3", 1), ("F3", 1), ("F3", 1), ("F3", 1),
        ("E3", 1), ("E3", 1), ("E3", 1), ("E3", 1),
    ], bpm, vol=0.16, wave="triangle")
    write_wav("bgm_battle.wav", mix(bt_lead, bt_bass))


if __name__ == "__main__":
    print("Generating SFX ->", OUT)
    build()
    print("Done.")
