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

# 6. Cyber Glitch / Sci-Fi Static
def gen_glitch(duration=0.55):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    freq_tones = [280, 520, 1100, 440, 880, 1760]
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t / 0.18) if t > 0.05 else (t / 0.05)
        stutter = 1.0 if (int(t * 70) % 2 == 0) else 0.15
        curr_freq = freq_tones[int(t * 30) % len(freq_tones)]
        s_tone = math.sin(2 * math.pi * curr_freq * t)
        s_sq = 1.0 if s_tone > 0 else -1.0
        noise = random.uniform(-0.8, 0.8)
        s = (s_sq * 0.45 + noise * 0.4 + s_tone * 0.3) * env * stutter
        samples.append(s)
    return samples

# 7. Tension Riser & Sub Drop
def gen_riser(duration=1.4):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    riser_dur = 1.0
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        if t < riser_dur:
            frac = t / riser_dur
            freq = 160 + 760 * (frac ** 2.2)
            env = frac ** 1.5
            mod = 1.0 + 0.3 * math.sin(2 * math.pi * (8 + 24 * frac) * t)
            s = math.sin(2 * math.pi * freq * t) * env * mod * 0.6
        else:
            dt = t - riser_dur
            drop_env = math.exp(-dt / 0.12)
            drop_freq = 55 + 50 * math.exp(-dt / 0.08)
            s = math.sin(2 * math.pi * drop_freq * dt) * drop_env * 0.95
        samples.append(s)
    return samples

# 8. Cash Register / Coin Clink
def gen_kaching(duration=0.85):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env1 = math.exp(-t / 0.22)
        s1 = (math.sin(2 * math.pi * 2750 * t) * 0.6 +
              math.sin(2 * math.pi * 3820 * t) * 0.35 +
              math.sin(2 * math.pi * 5480 * t) * 0.15) * env1

        s2 = 0.0
        if t > 0.055:
            dt = t - 0.055
            env2 = math.exp(-dt / 0.28)
            s2 = (math.sin(2 * math.pi * 3200 * dt) * 0.65 +
                  math.sin(2 * math.pi * 4400 * dt) * 0.3) * env2

        s_click = 0.0
        if t < 0.04:
            s_click = random.uniform(-0.5, 0.5) * math.exp(-t / 0.008)

        samples.append(s1 * 0.55 + s2 * 0.6 + s_click * 0.4)
    return samples

# 9. Cinematic Taiko / Heavy Drum Impact
def gen_drum_impact(duration=1.25):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        stick_env = math.exp(-t / 0.015)
        stick_noise = random.uniform(-0.8, 0.8) * stick_env * 0.5
        body_freq = 58 + 52 * math.exp(-t / 0.04)
        body_env = math.exp(-t / 0.32)
        body = math.sin(2 * math.pi * body_freq * t) * body_env * 0.85
        s = math.tanh(stick_noise + body * 1.4)
        samples.append(s)
    return samples

# 10. Magic Sparkle / Crystal Ding
def gen_magic_sparkle(duration=1.2):
    n_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * n_samples
    notes = [
        (0.00, 523.25),  # C5
        (0.05, 659.25),  # E5
        (0.10, 783.99),  # G5
        (0.16, 1046.50), # C6
        (0.24, 1318.51), # E6
    ]
    for offset_sec, freq in notes:
        start_idx = int(offset_sec * SAMPLE_RATE)
        for j in range(n_samples - start_idx):
            idx = start_idx + j
            t = j / SAMPLE_RATE
            env = (1.0 - math.exp(-t / 0.004)) * math.exp(-t / 0.35)
            tone = (math.sin(2 * math.pi * freq * t) * 0.7 +
                    math.sin(2 * math.pi * freq * 2 * t) * 0.25 +
                    math.sin(2 * math.pi * freq * 3 * t) * 0.1) * env * 0.45
            samples[idx] += tone
    return samples

# 11. Tension Heartbeat / Sub Pulse
def gen_heartbeat(duration=1.1):
    n_samples = int(duration * SAMPLE_RATE)
    samples = [0.0] * n_samples

    def add_pulse(offset_sec, amp, freq):
        start_idx = int(offset_sec * SAMPLE_RATE)
        pulse_samples = int(0.35 * SAMPLE_RATE)
        for j in range(pulse_samples):
            idx = start_idx + j
            if idx < n_samples:
                t = j / SAMPLE_RATE
                env = (1.0 - math.exp(-t / 0.02)) * math.exp(-t / 0.08)
                s = math.sin(2 * math.pi * freq * t) * env * amp
                samples[idx] += s

    add_pulse(0.04, amp=1.0, freq=52)   # First thump (lub)
    add_pulse(0.28, amp=0.85, freq=58)  # Second thump (dub)
    return samples

# 12. Electric Spark / Shock Zap
def gen_electric_zap(duration=0.38):
    n_samples = int(duration * SAMPLE_RATE)
    samples = []
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t / 0.08)
        freq = 2400 + 1200 * math.sin(2 * math.pi * 180 * t) + random.uniform(-400, 400)
        buzz = math.sin(2 * math.pi * freq * t)
        snap = random.uniform(-0.9, 0.9) if (int(t * 120) % 3 == 0) else 0.0
        s = (buzz * 0.6 + snap * 0.5) * env
        samples.append(s)
    return samples

generators = {
    'chime.wav': gen_chime,
    'whoosh.wav': gen_whoosh,
    'boom.wav': gen_boom,
    'camera.wav': gen_camera,
    'pop.wav': gen_pop,
    'glitch.wav': gen_glitch,
    'riser.wav': gen_riser,
    'kaching.wav': gen_kaching,
    'drum_impact.wav': gen_drum_impact,
    'magic_sparkle.wav': gen_magic_sparkle,
    'heartbeat.wav': gen_heartbeat,
    'electric_zap.wav': gen_electric_zap,
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