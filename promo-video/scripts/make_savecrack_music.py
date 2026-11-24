#!/usr/bin/env python3
"""Synthesizes the soundtrack and sound effects of the save-crack video.

An original mid-tempo K-pop-style groove: punchy drums, a pumping synth
bass, a sidechained pad, plucked arpeggios and a short lead hook. Everything
comes from oscillators and noise, so the audio has no third-party rights
attached. Output (48 kHz, 16-bit stereo WAV) in public/savecrack/:

  music.wav    100 BPM, F minor, LENGTH seconds
  sfx_type.wav one keystroke
  sfx_ok.wav   a two-note "check" chime
  sfx_whoosh.wav filtered-noise whoosh for scene changes

Usage: python3 scripts/make_savecrack_music.py
"""

import os

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
LENGTH = 80.0

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "savecrack")

rng = np.random.default_rng(325)

# i - VI - III - VII in F minor (Fm, Db, Ab, Eb), one chord per bar.
CHORDS = [
    [53, 56, 60],  # F  Ab C
    [49, 53, 56],  # Db F  Ab
    [56, 60, 63],  # Ab C  Eb
    [51, 55, 58],  # Eb G  Bb
]
ROOTS = [41, 37, 44, 39]

# The hook: (beat offset in a 2-bar phrase, MIDI note, length in beats).
HOOK = [
    (0.0, 72, 0.5), (0.5, 75, 0.5), (1.0, 77, 1.0), (2.5, 75, 0.5),
    (3.0, 72, 1.0), (4.5, 68, 0.5), (5.0, 70, 0.5), (5.5, 72, 1.5),
]

# Arrangement, in bars: (start bar, name).
# Intro (sparse), build, main groove, break, main groove again, outro.
SECTIONS = [
    (0, "intro"), (4, "build"), (8, "main"), (20, "break"), (24, "main"),
    (32, "outro"),
]


def section(bar):
    name = SECTIONS[0][1]
    for start, n in SECTIONS:
        if bar >= start:
            name = n
    return name


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def place(buf, sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= buf.shape[1]:
        return
    n = min(len(sig), buf.shape[1] - i)
    left = np.cos((pan + 1) * np.pi / 4)
    right = np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + n] += sig[:n] * gain * left * np.sqrt(2)
    buf[1, i:i + n] += sig[:n] * gain * right * np.sqrt(2)


def adsr(n, attack, decay, sustain, release):
    env = np.full(n, sustain)
    a, d, r = (max(1, int(x * SR)) for x in (attack, decay, release))
    env[:a] = np.linspace(0, 1, a)
    env[a:a + d] = np.linspace(1, sustain, min(d, max(0, n - a)))[: max(0, min(d, n - a))]
    env[-r:] *= np.linspace(1, 0, r)
    return env


def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for d in (-detune, 0.0, detune) if detune else (0.0,):
        f = freq * (1 + d)
        out += 2 * ((t * f + rng.random()) % 1) - 1
    return out / (3 if detune else 1)


# --- Instruments --------------------------------------------------------------

def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    freq = 45 + 110 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t * 7)
    click = highpass(rng.standard_normal(n), 3000) * np.exp(-t * 300) * 0.3
    return np.tanh((body + click) * 1.6)


def snare():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.5
    noise = lowpass(highpass(rng.standard_normal(n), 1200), 9000) * np.exp(-t * 14)
    return tone + noise * 0.8


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    noise = lowpass(highpass(rng.standard_normal(n), 900), 6000)
    env = np.exp(-t * 18)
    for k in (0.0, 0.011, 0.022):  # three quick hands
        env += np.exp(-np.maximum(t - k, 0) * 120) * (t >= k) * 0.6
    return noise * env * 0.6


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    t = np.arange(n) / SR
    noise = highpass(rng.standard_normal(n), 7500)
    return noise * np.exp(-t * (14 if open_ else 70)) * 0.35


def bass(note, beats):
    n = int(beats * BEAT * SR)
    f = midi_hz(note)
    raw = saw(f, n) * 0.6 + np.sin(2 * np.pi * f * np.arange(n) / SR)
    return np.tanh(lowpass(raw, 700) * 1.4) * adsr(n, 0.005, 0.12, 0.7, 0.04)


def pluck(note, beats=0.5, bright=1.0):
    n = int(max(beats * BEAT, 0.25) * SR)
    sig = saw(midi_hz(note), n, detune=0.004)
    t = np.arange(n) / SR
    # A filter that closes quickly gives the pluck.
    filtered = lowpass(sig, 1800 * bright) * 0.6 + lowpass(sig, 5000 * bright) * np.exp(-t * 30) * 0.4
    return filtered * np.exp(-t * 7)


def lead(note, beats):
    n = int(beats * BEAT * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 3, 0, 1)
    phase = np.cumsum(midi_hz(note) * vib) / SR
    sq = np.sign(np.sin(2 * np.pi * phase)) * 0.35 + (2 * (phase % 1) - 1) * 0.4
    return lowpass(sq, 3200) * adsr(n, 0.01, 0.15, 0.6, 0.08)


def pad(chord, seconds):
    n = int(seconds * SR)
    out = np.zeros(n)
    for m in chord:
        out += saw(midi_hz(m), n, detune=0.006) + saw(midi_hz(m + 12), n, detune=0.008) * 0.4
    return lowpass(out / len(chord), 1400) * adsr(n, 0.3, 0.2, 0.9, 0.5)


def riser(seconds):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    # Sweep the filter up in steps (cheap, sounds fine).
    steps = 16
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps
        hz = 400 * (20 ** (k / steps))
        out[a:b] = lowpass(noise, hz)[a:b]
    return out * (t / seconds) ** 2 * 0.5


def reverb(stereo, seconds=2.2, mix=0.22):
    n = int(seconds * SR)
    decay = np.exp(-np.linspace(0, 6, n))
    out = np.empty_like(stereo)
    for ch in range(2):
        ir = lowpass(rng.standard_normal(n), 5000) * decay
        ir /= np.sqrt(np.sum(ir ** 2))
        wet = fftconvolve(stereo[ch], ir)[: stereo.shape[1]]
        out[ch] = stereo[ch] * (1 - mix) + wet * mix
    return out


def sidechain(n_samples):
    """Ducks on every beat, like a compressor keyed by the kick."""
    t = np.arange(n_samples) / SR
    phase = (t % BEAT) / BEAT
    return 1 - 0.55 * np.exp(-phase * 9)


# --- Arrangement --------------------------------------------------------------

def build_music():
    total = int(LENGTH * SR)
    drums = np.zeros((2, total))
    tonal = np.zeros((2, total))
    leads = np.zeros((2, total))
    bars = int(LENGTH / BAR) + 1

    k, s, c = kick(), snare(), clap()
    for bar in range(bars):
        start = bar * BAR
        name = section(bar)
        chord = CHORDS[bar % 4]
        root = ROOTS[bar % 4]

        # Pad under everything but the very end.
        if name != "outro" or bar < 34:
            place(tonal, pad(chord, BAR + 0.4), start, 0.20 if name in ("intro", "break") else 0.15)

        # Arpeggio: up-down eighths over the chord.
        if name in ("intro", "build", "main", "break"):
            order = [0, 1, 2, 1, 0, 1, 2, 1]
            bright = 0.6 if name in ("intro", "break") else 1.0
            for i, idx in enumerate(order):
                if name == "intro" and i % 2:
                    continue
                note = chord[idx] + (12 if i >= 4 else 0)
                place(tonal, pluck(note, 0.5, bright), start + i * BEAT / 2, 0.22,
                      pan=-0.35 if i % 2 else 0.35)

        # Drums.
        if name in ("build", "main"):
            for beat in range(4):
                t = start + beat * BEAT
                if name == "main" or beat % 2 == 0:
                    place(drums, k, t, 0.9)
                if name == "main" and beat in (1, 3):
                    place(drums, s, t, 0.45)
                    place(drums, c, t, 0.4, pan=0.1)
                for half in (0, 1):
                    place(drums, hat(open_=half == 1 and name == "main"), t + half * BEAT / 2,
                          0.6 if half else 0.4, pan=0.25)
            # A little kick push into the next bar.
            if name == "main" and bar % 2 == 1:
                place(drums, k, start + 3.5 * BEAT, 0.6)
        if name == "break":
            place(drums, k, start, 0.6)

        # Bass: root eighths with an octave jump on the off-beats.
        if name in ("build", "main"):
            for i in range(8):
                note = root + (12 if i % 4 == 3 else 0)
                place(tonal, bass(note, 0.45), start + i * BEAT / 2, 0.38 if name == "main" else 0.25)

        # Hook: every two bars in the main sections.
        if name == "main" and bar % 2 == 0:
            for offset, note, beats in HOOK:
                place(leads, lead(note, beats), start + offset * BEAT, 0.20, pan=0.05)

        # Risers into the drops.
        if bar in (7, 23):
            place(tonal, riser(BAR), start, 0.5)

    # Final chord rings out.
    end = 34 * BAR
    place(tonal, pad(CHORDS[0], 5.0), end, 0.25)
    place(tonal, pluck(CHORDS[0][2] + 12, 4.0, 0.7), end, 0.25)

    tonal *= sidechain(total)
    mix = drums + reverb(tonal) + reverb(leads, 1.6, 0.3)
    # Fade out the last 3 seconds.
    fade = int(3 * SR)
    mix[:, -fade:] *= np.linspace(1, 0, fade)
    return mix


# --- Sound effects --------------------------------------------------------------

def sfx_type():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    click = highpass(rng.standard_normal(n), 2500) * np.exp(-t * 180)
    thock = np.sin(2 * np.pi * 420 * t) * np.exp(-t * 90) * 0.4
    return np.vstack([click + thock] * 2) * 0.5


def sfx_ok():
    out = np.zeros(int(0.9 * SR))
    for start, note in ((0.0, 84), (0.09, 91)):
        n = len(out) - int(start * SR)
        t = np.arange(n) / SR
        tone = (np.sin(2 * np.pi * midi_hz(note) * t)
                + 0.3 * np.sin(2 * np.pi * midi_hz(note) * 2 * t)) * np.exp(-t * 6)
        out[int(start * SR):] += tone * 0.5
    return np.vstack([out, out])


def sfx_whoosh():
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    shape = np.sin(np.pi * t / t[-1]) ** 2
    out = np.zeros(n)
    steps = 12
    for k in range(steps):
        a, b = k * n // steps, (k + 1) * n // steps
        hz = 600 + 5000 * np.sin(np.pi * k / steps)
        out[a:b] = lowpass(noise, hz)[a:b]
    out *= shape * 0.6
    return np.vstack([out * 0.9, out])


def normalize(x, peak_db=-1.0):
    return x / np.max(np.abs(x)) * 10 ** (peak_db / 20)


def write_wav(path, stereo):
    import wave
    data = (np.clip(stereo, -1, 1).T * 32767).astype("<i2")
    with wave.open(path, "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(data.tobytes())
    print("wrote", os.path.relpath(path), f"{stereo.shape[1] / SR:.1f}s")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    write_wav(os.path.join(OUT_DIR, "music.wav"), normalize(build_music(), -1.5))
    write_wav(os.path.join(OUT_DIR, "sfx_type.wav"), normalize(sfx_type(), -6))
    write_wav(os.path.join(OUT_DIR, "sfx_ok.wav"), normalize(sfx_ok(), -4))
    write_wav(os.path.join(OUT_DIR, "sfx_whoosh.wav"), normalize(sfx_whoosh(), -5))


if __name__ == "__main__":
    main()
