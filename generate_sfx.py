import os
import wave
import math
import struct
import random

SAMPLE_RATE = 44100

def write_wav(filepath, samples):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with wave.open(filepath, 'w') as wav:
        wav.setnchannels(1)        # mono
        wav.setsampwidth(2)        # 16-bit
        wav.setframerate(SAMPLE_RATE)
        # Normalize and convert to 16-bit PCM
        max_val = max(abs(s) for s in samples) or 1.0
        scale = 32767.0 / max_val * 0.95
        raw = bytearray()
        for s in samples:
            val = int(s * scale)
            val = max(-32768, min(32767, val))
            raw.extend(struct.pack('<h', val))
        wav.writeframes(raw)
    print(f"Generated {filepath} ({len(samples)/SAMPLE_RATE:.2f}s)")

# 1. Chime / Notification Bell (880Hz + 1320Hz bell harmonics)
def gen_chime(duration=1.2):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        # Envelope: fast 5ms attack, exponential decay
        env = (1.0 - math.exp(-t / 0.005)) * math.exp(-t / 0.35)
        # Tones: fundamental A5 (880Hz) + harmonic E6 (1320Hz) + shimmer (2640Hz)
        s = (math.sin(2 * math.pi * 880 * t) * 0.65 +
             math.sin(2 * math.pi * 1320 * t) * 0.25 +
             math.sin(2 * math.pi * 2640 * t) * 0.10) * env
        samples.append(s)
    return samples

# 2. Fast Whoosh / Swoosh (Frequency swept filtered noise)
def gen_whoosh(duration=0.65):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    # Simple lowpass filter memory
    prev = 0.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        # Bell curve envelope
        env = math.sin(math.pi * (t / duration)) ** 2
        # Frequency modulation for wind effect
        cutoff = 0.05 + 0.35 * math.sin(math.pi * (t / duration))
        white_noise = random.uniform(-1.0, 1.0)
        # 1-pole low-pass filter
        filtered = prev + cutoff * (white_noise - prev)
        prev = filtered
        # Add a low sine sweep for body
        freq = 180 + 350 * math.sin(math.pi * (t / duration))
        body = math.sin(2 * math.pi * freq * t) * 0.3
        samples.append((filtered * 0.7 + body) * env)
    return samples

# 3. Cinematic Sub-Bass Boom
def gen_boom(duration=1.5):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        # Envelope: punchy attack, slow bass decay
        env = (1.0 - math.exp(-t / 0.008)) * math.exp(-t / 0.45)
        # Pitch drops from 95Hz down to 42Hz
        freq = 42 + 53 * math.exp(-t / 0.2)
        # Sub-bass sine with subtle saturation
        s = math.sin(2 * math.pi * freq * t)
        # Soft clipping/saturation for analog warmth
        s = math.tanh(s * 1.3) * env
        samples.append(s)
    return samples

# 4. Camera Shutter Click (Two rapid mechanical snaps)
def gen_camera(duration=0.35):
    n_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * n_samples
    
    def add_click(offset_sec, amp=1.0):
        start_idx = int(offset_sec * SAMPLE_RATE)
        click_samples = int(0.04 * SAMPLE_RATE)
        for j in range(click_samples):
            idx = start_idx + j
            if idx < n_samples:
                t = j / SAMPLE_RATE
                env = math.exp(-t / 0.006)
                noise = random.uniform(-1.0, 1.0) * env * amp
                tone = math.sin(2 * math.pi * 1400 * t) * env * 0.4 * amp
                samples[idx] += noise + tone

    add_click(0.02, amp=1.0)   # mirror click
    add_click(0.09, amp=0.85)  # shutter click
    return samples

# 5. Clean Bubble Pop
def gen_pop(duration=0.25):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t / 0.025)
        # Pitch rises rapidly 350Hz -> 850Hz
        freq = 350 + (850 - 350) * min(1.0, t / 0.035)
        s = math.sin(2 * math.pi * freq * t) * env
        samples.append(s)
    return samples

generators = {
    'chime.wav': gen_chime,
    'whoosh.wav': gen_whoosh,
    'boom.wav': gen_boom,
    'camera.wav': gen_camera,
    'pop.wav': gen_pop,
}

targets = [
    os.path.join('assets', 'sfx'),
    os.path.join('dashboard', 'public', 'sfx')
]

for filename, fn in generators.items():
    audio = fn()
    for tdir in targets:
        write_wav(os.path.join(tdir, filename), audio)

print("ALL COPYRIGHT-FREE SFX GENERATED SUCCESSFULLY!")