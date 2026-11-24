#!/usr/bin/env python3
"""Synthesizes the promo's original soundtrack and sound effects.

Everything is generated from oscillators and noise, so the audio has no
third-party rights attached. Output (48 kHz, 16-bit stereo WAV):

  public/audio/music.wav        96 BPM cinematic ambient bed, 95 s
  public/audio/sfx_swell.wav    soft filtered-noise swell for transitions
  public/audio/sfx_chime.wav    soft bell for logo reveals

The arrangement follows the storyboard's acts (see docs/STORYBOARD.md):
pad only during the opening, a slow pulse from 10 s, the full groove during
the game showcase, a thinner groove for the features, pad and arpeggio for
the tech scene and a resolving chord at the end.

Usage: python3 scripts/make_music.py
"""

import os

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
BPM = 96
BEAT = 60 / BPM
BAR = BEAT * 4
LENGTH = 95.0

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")

rng = np.random.default_rng(67)


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(seconds):
    return np.arange(int(seconds * SR)) / SR


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def place(buf, sig, start):
    i = int(start * SR)
    if i >= buf.shape[-1]:
        return
    n = min(sig.shape[-1], buf.shape[-1] - i)
    buf[..., i:i + n] += sig[..., :n]


def envelope(n, attack, release, hold=None):
    """Linear attack, flat hold, cosine release, all in seconds."""
    env = np.ones(n)
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    env[:a] = np.linspace(0, 1, a)
    env[-r:] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, r)))
    return env


def reverb(stereo, seconds=3.2, mix=0.35):
    n = int(seconds * SR)
    decay = np.exp(-np.linspace(0, 7, n))
    out = np.empty_like(stereo)
    for ch in range(2):
        ir = lowpass(rng.standard_normal(n), 6000) * decay
        ir /= np.sqrt(np.sum(ir ** 2))
        wet = fftconvolve(stereo[ch], ir)[: stereo.shape[1]]
        out[ch] = stereo[ch] * (1 - mix) + wet * mix
    return out


def pan(sig, p):
    """p in [-1, 1]; constant-power."""
    a = (p + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)])


# Am(add9) – Fmaj7 – Cmaj7(add9) – G6, two bars each.
CHORDS = [
    [57, 60, 64, 71],
    [53, 57, 60, 64],
    [48, 55, 59, 62],
    [55, 59, 62, 64],
]
BASS = [45, 41, 48, 43]


def chord_at(time):
    return int(time // (BAR * 2)) % len(CHORDS)


def pad_voice(freq, seconds):
    t = t_axis(seconds)
    sig = np.zeros_like(t)
    for detune in (-0.12, 0.0, 0.11):
        f = freq * 2 ** (detune / 12)
        phase = rng.uniform(0, 1)
        saw = 2 * ((t * f + phase) % 1) - 1
        sig += saw
    sig = lowpass(sig / 3, 900 + freq * 1.5)
    sig += 0.6 * np.sin(2 * np.pi * freq * t)
    return sig


def pluck(freq, seconds=1.6, bright=1.0):
    t = t_axis(seconds)
    env = np.exp(-t * 3.2) * np.minimum(1, t / 0.004)
    sig = np.sin(2 * np.pi * freq * t) + 0.25 * bright * np.sin(4 * np.pi * freq * t) * np.exp(-t * 6)
    return sig * env


def bell(freq, seconds=4.0):
    t = t_axis(seconds)
    sig = np.zeros_like(t)
    for ratio, amp, dec in ((1, 1.0, 1.1), (2.76, 0.35, 2.2), (5.4, 0.15, 3.5), (0.5, 0.3, 0.8)):
        sig += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t * dec)
    return sig * np.minimum(1, t / 0.006)


def kick():
    t = t_axis(0.6)
    f = 46 + 70 * np.exp(-t * 28)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    return lowpass(sig, 180)


def hat():
    t = t_axis(0.09)
    return highpass(rng.standard_normal(t.size), 7000) * np.exp(-t * 60)


def swell(seconds=2.4):
    t = t_axis(seconds)
    noise = rng.standard_normal(t.size)
    # Two filtered bands crossfaded to suggest a rising cutoff.
    low, high = lowpass(noise, 500), lowpass(noise, 2400)
    rise = (t / seconds) ** 2
    sig = low * (1 - rise) + high * rise
    env = np.sin(np.pi * np.clip(t / seconds, 0, 1)) ** 2
    return highpass(sig, 80) * env


def section_level(time):
    """Per-layer gains by act: (pad, pulse, groove, arp)."""
    if time < 10:
        return 1.0, 0.0, 0.0, 0.25
    if time < 22:
        return 0.9, 0.7, 0.0, 0.5
    if time < 32:
        return 1.0, 0.5, 0.0, 0.6
    if time < 62:
        return 0.75, 0.0, 1.0, 1.0
    if time < 78:
        return 0.75, 0.0, 0.7, 0.8
    if time < 84:
        return 0.9, 0.0, 0.0, 0.7
    return 1.0, 0.0, 0.0, 0.3


def build_music():
    n = int(LENGTH * SR)
    mix = np.zeros((2, n))
    drums = np.zeros((2, n))

    # Pad: one voice per chord change, overlapping crossfades.
    seg = BAR * 2
    for k in range(int(LENGTH / seg) + 1):
        start = k * seg
        lvl = section_level(start)[0]
        notes = CHORDS[k % 4]
        dur = seg + 1.6
        for j, m in enumerate(notes):
            v = pad_voice(midi_hz(m), dur) * envelope(int(dur * SR), 1.4, 1.6)
            place(mix, pan(v * 0.05 * lvl, -0.5 + j / 3), start)
        b = np.sin(2 * np.pi * midi_hz(BASS[k % 4] - 12) * t_axis(dur)) * envelope(int(dur * SR), 0.8, 1.2)
        place(mix, pan(b * 0.09 * lvl, 0), start)

    # Opening: hold one long Am chord instead of moving harmony.
    # (The chord cycle already starts on Am; nothing extra needed.)

    # Arpeggio: eighth notes over the chord, sparse in the quiet acts.
    step = BEAT / 2
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    i = 0
    time = 0.0
    while time < LENGTH - 2:
        lvl = section_level(time)[3]
        sparse = lvl < 0.5 and i % 2 == 1
        if lvl > 0 and not sparse:
            notes = CHORDS[chord_at(time)]
            m = notes[pattern[i % 8]] + 12
            p = pluck(midi_hz(m), bright=0.6 + 0.4 * lvl)
            place(mix, pan(p * 0.045 * lvl, 0.35 if i % 2 else -0.35), time)
        time += step
        i += 1

    # Pulse (10–32 s): a soft kick once per bar.
    # Groove (32–78 s): kick on 1 and 3, hats on the off-beats.
    beat = 0
    time = 0.0
    while time < LENGTH:
        _, pulse, groove, _ = section_level(time)
        if pulse and beat % 4 == 0:
            place(drums, pan(kick() * 0.35 * pulse, 0), time)
        if groove:
            if beat % 2 == 0:
                place(drums, pan(kick() * 0.42 * groove, 0), time)
            place(drums, pan(hat() * 0.05 * groove, 0.25), time + BEAT / 2)
        time += BEAT
        beat += 1

    mix = reverb(mix, 3.6, 0.4) + reverb(drums, 1.2, 0.15)

    # Final resolve: Am(add9) with a bell on top at the closing logo.
    for j, m in enumerate([45, 57, 64, 71, 76]):
        v = pad_voice(midi_hz(m), 9) * envelope(9 * SR, 1.0, 5.0)
        place(mix, pan(v * 0.045, -0.4 + j * 0.2), 84.0)

    # Global fade-in and fade-out.
    t = t_axis(LENGTH)
    fade = np.minimum(1, t / 3.0) * np.clip((92.0 - t) / 4.0, 0, 1)
    mix *= fade
    return mix


def normalize(x, peak_db=-1.0):
    return x / np.max(np.abs(x)) * 10 ** (peak_db / 20)


def write_wav(path, stereo):
    import wave

    data = (np.clip(stereo, -1, 1) * 32767).astype("<i2").T.copy()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    write_wav(os.path.join(OUT_DIR, "music.wav"), normalize(build_music(), -3.0))

    s = reverb(pan(swell(), 0), 2.0, 0.3)
    write_wav(os.path.join(OUT_DIR, "sfx_swell.wav"), normalize(s, -6.0))

    c = bell(midi_hz(76)) * 0.7 + bell(midi_hz(83), 4.0) * 0.3
    c = reverb(np.stack([c, np.roll(c, 240)]), 3.0, 0.45)
    write_wav(os.path.join(OUT_DIR, "sfx_chime.wav"), normalize(c, -6.0))
    print("wrote", os.path.abspath(OUT_DIR))


if __name__ == "__main__":
    main()
