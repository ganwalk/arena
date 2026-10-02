"""Trilha do vídeo brag (video/trilha.wav), sintetizada do zero: 120 bpm, Lá menor, 50 s.

Os cortes de cena caem nos tempos fortes; cada corte tem um "whoosh" e as viradas grandes têm impacto.
Uso: python3 video/trilha.py   (precisa de numpy)
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
DUR = 50.0
BPM = 120
BEAT = 60 / BPM
N = int(SR * DUR)
rng = np.random.default_rng(7)
mix = {k: np.zeros(N) for k in ("bateria", "baixo", "pad", "arp", "fx")}

CORTES = [3, 9, 15, 21, 31, 37, 40.5, 44]
IMPACTOS = [3, 21, 44, 46.5]
# compassos de 2 s começando em t = 1 s: Am F C G
ACORDES = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def acorde(t):
    return ACORDES[int(max(0, (t - 1) // 2)) % 4]


def por(trilha, t, sinal, ganho=1.0):
    i = int(t * SR)
    if i >= N:
        return
    fim = min(N, i + len(sinal))
    mix[trilha][i:fim] += sinal[: fim - i] * ganho


def env(n, a, d):
    x = np.arange(n) / SR
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)


def passa_faixa(sinal, baixo, alto):
    f = np.fft.rfft(sinal)
    fr = np.fft.rfftfreq(len(sinal), 1 / SR)
    f[(fr < baixo) | (fr > alto)] = 0
    return np.fft.irfft(f, len(sinal))


def bumbo():
    n = int(0.45 * SR)
    x = np.arange(n) / SR
    freq = 48 + 110 * np.exp(-x / 0.035)
    fase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(fase) * np.exp(-x / 0.18) + 0.25 * passa_faixa(rng.standard_normal(n), 1500, 6000) * np.exp(-x / 0.004)


def palma():
    n = int(0.3 * SR)
    x = np.arange(n) / SR
    ruido = passa_faixa(rng.standard_normal(n), 900, 5000)
    e = sum(np.exp(-np.maximum(x - k, 0) / 0.012) * (x >= k) for k in (0, 0.011, 0.022)) + 0.6 * np.exp(-x / 0.09)
    return ruido * e * 0.5


def chimbal(aberto=False):
    n = int((0.22 if aberto else 0.06) * SR)
    x = np.arange(n) / SR
    return passa_faixa(rng.standard_normal(n), 7000, 16000) * np.exp(-x / (0.07 if aberto else 0.018))


def baixo(m, dur):
    n = int(dur * SR)
    x = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * x) + 0.35 * np.sin(4 * np.pi * f * x) + 0.12 * np.sin(6 * np.pi * f * x)
    return s * env(n, 0.006, dur * 0.7) * np.minimum(1, (n - np.arange(n)) / (0.01 * SR))


def nota_arp(m, dur=0.2):
    n = int(dur * SR)
    x = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * x + 0.8 * np.sin(2 * np.pi * f * 2 * x) * np.exp(-x / 0.05))
    return s * env(n, 0.003, 0.08)


def pad(notas, dur):
    n = int(dur * SR)
    x = np.arange(n) / SR
    s = np.zeros(n)
    for m in notas:
        for det in (-0.08, 0.0, 0.08):
            f = hz(m + det)
            s += np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x + 0.5)
    ataque = np.minimum(1, x / 0.35)
    soltura = np.minimum(1, (dur - x) / 0.5)
    return s / (len(notas) * 3) * ataque * np.clip(soltura, 0, 1)


def whoosh(dur=0.5):
    n = int(dur * SR)
    x = np.arange(n) / SR
    r = passa_faixa(rng.standard_normal(n), 400, 9000)
    e = (x / dur) ** 2.2 * np.minimum(1, (dur - x) / 0.03)
    return r * e * 0.45


def subida(dur):
    n = int(dur * SR)
    x = np.arange(n) / SR
    r = passa_faixa(rng.standard_normal(n), 300, 12000)
    tom = np.sin(2 * np.pi * np.cumsum(200 + 900 * (x / dur) ** 2) / SR)
    return (r * 0.5 + tom * 0.15) * (x / dur) ** 3


def impacto():
    n = int(2.2 * SR)
    x = np.arange(n) / SR
    freq = 32 + 90 * np.exp(-x / 0.08)
    s = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x / 0.6)
    s += passa_faixa(rng.standard_normal(n), 200, 8000) * np.exp(-x / 0.25) * 0.35
    return s


# ---- arranjo ----
def groove(t):
    return (3 <= t < 37) or (44 <= t < 46.5)


def tem_arp(t):
    return (9 <= t < 31) or (37 <= t < 46.5)


k = 0
while True:
    t = k * BEAT / 4  # semicolcheias
    if t >= DUR:
        break
    pos = k % 16  # posição no compasso começando em t = 1 s (deslocado de 2 tempos)
    tempo_no_compasso = ((t - 1) / BEAT) % 4
    if groove(t):
        if k % 4 == 0:
            por("bateria", t, bumbo(), 0.95)
            if round(tempo_no_compasso) % 2 == 1:
                por("bateria", t, palma(), 0.55)
        if k % 4 == 2:
            por("bateria", t, chimbal(aberto=(k % 8 == 6)), 0.22)
        elif k % 2 == 1:
            por("bateria", t, chimbal(), 0.08)
        if k % 2 == 0:
            raiz = acorde(t)[0] - 24
            if raiz < 31:
                raiz += 12
            por("baixo", t, baixo(raiz + (12 if k % 8 == 6 else 0), BEAT / 2), 0.42)
    elif 37 <= t < 44 and k % 2 == 1:
        por("bateria", t, chimbal(), 0.06)
    if tem_arp(t) and k % 2 == 0:
        notas = acorde(t) + [acorde(t)[0] + 12]
        padrao = [0, 1, 2, 3, 2, 1, 3, 2]
        por("arp", t, nota_arp(notas[padrao[(k // 2) % 8]] + 12), 0.16)
    k += 1

# pad: um acorde por compasso, mais a abertura e o fecho
por("pad", 0, pad(ACORDES[0], 3.2), 0.0)
for b in range(-1, 25):
    t0 = 1 + 2 * b
    if t0 >= 46.5:
        break
    ini = max(0, t0)
    por("pad", ini, pad(acorde(max(t0, 0) + 0.01) if t0 >= 1 else ACORDES[0], (t0 + 2.3) - ini), 0.32 if 37 <= t0 < 44 else 0.2)
por("pad", 46.5, pad([45, 57, 60, 64, 69], 3.5), 0.5)
por("baixo", 46.5, baixo(33, 3.3), 0.5)

# abertura: pops dos módulos e subida até o primeiro corte
for i, t in enumerate([0.15, 0.45, 0.75, 1.05, 1.35]):
    por("arp", t, nota_arp([69, 72, 76, 79, 81][i] + 12, 0.3), 0.12)
por("fx", 1.6, subida(1.4), 0.5)
por("fx", 42.4, subida(1.6), 0.55)
for c in CORTES:
    por("fx", c - 0.5, whoosh(0.5), 0.55)
for c in IMPACTOS:
    por("fx", c, impacto(), 0.6)

# ---- mixagem ----
ganhos = {"bateria": 0.9, "baixo": 0.8, "pad": 0.55, "arp": 0.6, "fx": 0.7}
saida = sum(mix[k] * g for k, g in ganhos.items())
# ducking do pad e do baixo junto com o bumbo, para o groove respirar
x = np.arange(N) / SR
fase = ((x - 1) / BEAT) % 1
duck = np.where([groove(t) for t in x[:: SR // 100]], 1, 0)
duck = np.repeat(duck, SR // 100)[:N]
duck = np.pad(duck, (0, N - len(duck)), constant_values=0)
saida = saida - (mix["pad"] * ganhos["pad"] + mix["baixo"] * ganhos["baixo"]) * duck * 0.45 * np.exp(-fase / 0.12)
fade = np.clip((DUR - x) / 1.2, 0, 1) * np.clip(x / 0.05, 0, 1)
saida = np.tanh(saida * 1.3) * fade
saida = saida / np.max(np.abs(saida)) * 0.89

estereo = np.stack([saida, np.roll(saida, 9) * 0.98 + saida * 0.02], axis=1)
dados = (estereo * 32767).astype("<i2").tobytes()
destino = Path(__file__).with_name("trilha.wav")
with wave.open(str(destino), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(dados)
print(destino)
