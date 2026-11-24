#!/usr/bin/env python3
"""Synthesizes the upbeat soundtrack for the v0.3.26 release video.

Like make_music.py, everything comes from oscillators and noise, so the audio
is original with no third-party rights. Output (48 kHz, 16-bit stereo WAV):

  public/audio/upbeat.wav     128 BPM four-on-the-floor pop groove in D major
  public/audio/sfx_pop.wav    short bubbly blip for text and chips popping in
  public/audio/sfx_whoosh.wav rising noise sweep for transitions

The arrangement is in bars (one bar = 1.875 s) and matches
src/release/config.ts: a two-bar pluck intro and a two-bar build, the drop
on bar 4, a fill before each section and a final hit on bar 26.

Usage: python3 scripts/make_music_upbeat.py
"""

import os

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
BPM = 128
BEAT = 60 / BPM
BAR = BEAT * 4

DROP = 4
# Bars that start a new section; the bar before each gets a fill.
SECTIONS = [12, 17, 23]
FINAL = 26
LENGTH = FINAL * BAR + 4.0

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio")

rng = np.random.default_rng(128)

# D – A – Bm – G, one chord per bar.
CHORDS = [[62, 66, 69, 74], [61, 64, 69, 73], [62, 66, 71, 74], [62, 67, 71, 74]]
BASS = [38, 33, 35, 31]


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(seconds):
    return np.arange(int(seconds * SR)) / SR


def lowpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def highpass(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def place(buf, sig, start):
    i = int(round(start * SR))
    if i >= buf.shape[-1]:
        return
    n = min(sig.shape[-1], buf.shape[-1] - i)
    buf[..., i:i + n] += sig[..., :n]


def decay(n, seconds):
    return np.exp(-np.arange(n) / SR / seconds)


def saw(freq, t, detune=0.0):
    out = np.zeros_like(t)
    for d in (-detune, 0.0, detune):
        f = freq * 2 ** (d / 1200)
        out += 2 * ((t * f + rng.random()) % 1.0) - 1
    return out / 3


def pan(sig, p):
    return np.stack([sig * np.sqrt((1 - p) / 2), sig * np.sqrt((1 + p) / 2)])


def kick():
    t = t_axis(0.42)
    f = 48 + 110 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(len(t), 0.16)
    click = highpass(rng.standard_normal(len(t)), 2500) * decay(len(t), 0.004) * 0.3
    return body + click


def clap():
    n = int(0.3 * SR)
    noise = rng.standard_normal(n)
    env = decay(n, 0.07)
    for k in (0.0, 0.011, 0.022):
        i = int(k * SR)
        env[i:i + int(0.006 * SR)] += 0.8
    return sosfilt(butter(2, [900, 4000], "band", fs=SR, output="sos"), noise * env) * 1.6


def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    return highpass(rng.standard_normal(n), 7000) * decay(n, 0.07 if open_ else 0.012)


def crash():
    n = int(2.2 * SR)
    return highpass(rng.standard_normal(n), 4500) * decay(n, 0.6) * 0.5


def snare():
    n = int(0.16 * SR)
    t = t_axis(0.16)
    tone = np.sin(2 * np.pi * 190 * t) * decay(n, 0.04)
    return tone * 0.5 + highpass(rng.standard_normal(n), 1800) * decay(n, 0.05)


def pluck(freq, seconds=0.32):
    t = t_axis(seconds)
    sig = saw(freq, t, 8) + 0.5 * np.sin(2 * np.pi * freq * 2 * t)
    return lowpass(sig, 5200) * decay(len(t), 0.11)


def stab(chord, seconds=0.2):
    t = t_axis(seconds)
    sig = sum(saw(midi_hz(m), t, 14) for m in chord) / len(chord)
    env = np.minimum(1, t / 0.004) * decay(len(t), 0.09)
    return lowpass(sig, 3800) * env


def bass_note(freq, seconds):
    t = t_axis(seconds)
    sig = saw(freq, t, 4) * 0.6 + np.sin(2 * np.pi * freq * t)
    env = np.minimum(1, t / 0.005) * np.minimum(1, (seconds - t) / 0.02)
    return lowpass(sig, 700) * env


def pad(chord, seconds):
    t = t_axis(seconds)
    sig = sum(saw(midi_hz(m - 12), t, 18) for m in chord) / len(chord)
    env = np.minimum(1, t / 0.05) * np.minimum(1, (seconds - t) / 0.1)
    return lowpass(sig, 1800) * env


def riser(seconds):
    t = t_axis(seconds)
    noise = rng.standard_normal(len(t))
    # Sweep the band up by filtering in short blocks.
    out = np.zeros_like(noise)
    block = 1024
    for i in range(0, len(t), block):
        x = i / len(t)
        hz = 400 + 7000 * x ** 2
        seg = noise[max(0, i - 2048):i + block]
        out[i:i + block] = sosfilt(butter(2, hz, "low", fs=SR, output="sos"), seg)[-len(out[i:i + block]):]
    return out * (t / seconds) ** 2 * 0.5


def reverb(stereo, seconds=1.6, mix=0.18):
    n = int(seconds * SR)
    ir = rng.standard_normal((2, n)) * decay(n, seconds / 5)
    ir = lowpass(ir, 6000)
    wet = np.stack([fftconvolve(stereo[c], ir[c])[: stereo.shape[1]] for c in range(2)])
    wet *= np.max(np.abs(stereo)) / (np.max(np.abs(wet)) + 1e-9)
    return stereo * (1 - mix) + wet * mix


def sidechain(total):
    """Gain curve that ducks on every beat after the drop."""
    g = np.ones(total)
    duck = 1 - 0.65 * decay(int(BEAT * SR), 0.07)
    for b in range(DROP * 4, FINAL * 4):
        place(g, duck - 1, b * BEAT)
    return g


def build_music():
    total = int(LENGTH * SR)
    drums = np.zeros((2, total))
    synth = np.zeros((2, total))
    bass = np.zeros(total)

    k, c, s, cr = kick(), clap(), snare(), crash()
    for bar in range(FINAL):
        chord = CHORDS[bar % 4]
        root = BASS[bar % 4]
        t0 = bar * BAR
        groove = DROP <= bar < FINAL
        fill = bar + 1 in SECTIONS or bar + 1 == FINAL

        # Plucked arpeggio, 16ths, from the start.
        pattern = [0, 2, 1, 3, 2, 1, 3, 2]
        for i in range(16):
            note = chord[pattern[i % 8]] + (12 if i % 8 == 7 else 0)
            p = pluck(midi_hz(note)) * (0.22 if groove else 0.45)
            place(synth, pan(p, -0.35 if i % 2 else 0.35), t0 + i * BEAT / 4)

        if bar >= 2:
            # Closed hats in the build and the groove, open hats on offbeats.
            for i in range(16 if groove else 8):
                step = BEAT / 4 if groove else BEAT / 2
                place(drums, pan(hat() * (0.18 if i % 2 else 0.1), 0.25), t0 + i * step)
        if groove:
            for b in range(4):
                if not (fill and b == 3):
                    place(drums, pan(k * 0.95, 0), t0 + b * BEAT)
                place(drums, pan(hat(True) * 0.12, -0.2), t0 + b * BEAT + BEAT / 2)
                # Off-beat bass, the classic pop pump.
                place(bass, bass_note(midi_hz(root), BEAT * 0.45) * 0.5, t0 + b * BEAT + BEAT / 2)
                place(bass, bass_note(midi_hz(root + 12), BEAT * 0.2) * 0.25, t0 + b * BEAT + BEAT * 0.75)
            for b in (1, 3):
                if not (fill and b == 3):
                    place(drums, pan(c * 0.55, 0.05), t0 + b * BEAT)
            # Chord stabs on the "and" of 2 and 4.
            for off in (1.5, 3.5, 3.75):
                place(synth, pan(stab(chord) * 0.26, 0), t0 + off * BEAT)
            place(synth, pan(pad(chord, BAR) * 0.14, 0), t0)
        if fill:
            # Snare roll over the last beat.
            for i in range(8):
                place(drums, pan(s * (0.25 + 0.06 * i), 0), t0 + 3 * BEAT + i * BEAT / 8)
        if bar == DROP - 1 or bar + 1 in SECTIONS:
            place(synth, pan(riser(BAR * (2 if bar == DROP - 1 else 1)), 0) * 0.6,
                  t0 - (BAR if bar == DROP - 1 else 0))
        if bar == DROP or bar in SECTIONS:
            place(drums, pan(cr, 0.3), t0)
        if bar == DROP - 2:
            place(drums, pan(k * 0.6, 0), t0)

    # Final hit: kick, crash and a ringing chord.
    end = FINAL * BAR
    place(drums, pan(k, 0), end)
    place(drums, pan(cr * 1.2, 0.3), end)
    ring = sum(pad([m], 3.6) for m in CHORDS[0] + [50]) / 3
    ring *= decay(ring.shape[-1], 1.2)
    place(synth, pan(ring, 0), end)
    place(bass, bass_note(midi_hz(38), 1.2) * decay(int(1.2 * SR), 0.5) * 0.6, end)

    g = sidechain(total)
    mix = drums + reverb(synth * g, mix=0.22) + pan(bass * g, 0)
    return mix


def sfx_pop():
    t = t_axis(0.16)
    f = 600 + 900 * np.exp(-t / 0.03)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(len(t), 0.04)
    return pan(sig, 0)


def sfx_whoosh():
    seconds = 0.9
    t = t_axis(seconds)
    sig = riser(seconds) * np.minimum(1, (seconds - t) / 0.08) * 2
    return reverb(pan(sig, 0), 0.8, 0.3)


def normalize(x, peak_db=-1.0):
    return x / np.max(np.abs(x)) * 10 ** (peak_db / 20)


def write_wav(path, stereo):
    import wave

    data = (np.clip(stereo, -1, 1).T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"wrote {os.path.relpath(path)} ({stereo.shape[1] / SR:.1f} s)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    # Soft-clip the mix a little for loudness, then normalize.
    music = np.tanh(normalize(build_music(), 0) * 1.3)
    write_wav(os.path.join(OUT_DIR, "upbeat.wav"), normalize(music, -1.0))
    write_wav(os.path.join(OUT_DIR, "sfx_pop.wav"), normalize(sfx_pop(), -3.0))
    write_wav(os.path.join(OUT_DIR, "sfx_whoosh.wav"), normalize(sfx_whoosh(), -3.0))


if __name__ == "__main__":
    main()
