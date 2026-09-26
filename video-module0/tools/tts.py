#!/usr/bin/env python3
"""Génère la voix off de chaque scène et les timings des sous-titres.

Lit narration/module0.json, synthétise chaque phrase séparément, assemble
une piste par scène dans public/audio/<scene>.wav et écrit la position de
chaque phrase dans src/generated/timings.json. La vidéo cale ensuite la
durée de chaque scène sur celle de son audio.

Moteurs :
  kokoro      (défaut) modèle neuronal local, voix française ff_siwis
  elevenlabs  API ElevenLabs — nécessite ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID)
  say         macOS uniquement — voix système (Thomas, Amélie…)

Exemples :
  python3 tools/tts.py --only S01
  python3 tools/tts.py --episode E03 --engine elevenlabs
  python3 tools/tts.py            # tout le module
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
NARRATION = ROOT / "narration" / "module0.json"
AUDIO_DIR = ROOT / "public" / "audio"
TIMINGS = ROOT / "src" / "generated" / "timings.json"
MODELS = ROOT / "tools" / "models"

SAMPLE_RATE = 24000
GAP_S = 0.38  # silence entre deux phrases

# Prononciation : appliquée au texte envoyé à la voix, jamais aux sous-titres.
PRONUNCIATION = [
    (r"\bIA\b", "I A"),
    (r"\btokens\b", "tokènes"),
    (r"\btoken\b", "tokène"),
    (r"\bCPU\b", "C P U"),
    (r"\bGPU\b", "G P U"),
    (r"\bASIC\b", "a-sic"),
    (r"\bHBM", "H B M "),
    (r"\bPCB\b", "P C B"),
    (r"\bEDA\b", "E D A"),
    (r"\bPUE\b", "P U E"),
    (r"\bCPO\b", "C P O"),
    (r"\bABF\b", "A B F"),
    (r"\bASP\b", "A S P"),
    (r"\bASML\b", "A S M L"),
    (r"\bNVIDIA\b", "ènvidia"),
    (r"\bBroadcom\b", "Brodcom"),
    (r"lithographi", "litographi"),
    (r"arithméti", "aritméti"),
    (r"\bAWS\b", "A W S"),
    (r"\bKLA\b", "K L A"),
    (r"\bJSR\b", "J S R"),
    (r"\bASE\b", "A S E"),
    (r"\bHPE\b", "H P E"),
    (r"\bSEC\b", "S E C"),
    (r"\bSK\b", "S K"),
    (r"\bMWh\b", "mégawattheures"),
    (r"\bMW\b", "mégawatts"),
    (r"\bkW\b", "kilowatts"),
    (r"\bGW\b", "gigawatts"),
    (r"\bTo/s\b", "téraoctets par seconde"),
    (r"\bGo\b", "gigaoctets"),
]


def to_speech_text(sentence):
    text = sentence.get("say") or sentence["text"]
    if "say" in sentence:
        return text
    for pattern, repl in PRONUNCIATION:
        text = re.sub(pattern, repl, text)
    return text


class Kokoro:
    def __init__(self, voice, speed):
        from kokoro_onnx import Kokoro as K

        model = MODELS / "kokoro-v1.0.onnx"
        voices = MODELS / "voices-v1.0.bin"
        if not model.exists() or not voices.exists():
            sys.exit("Modèles Kokoro absents : lancer tools/setup-tts.sh")
        self.k = K(str(model), str(voices))
        self.voice = voice or "ff_siwis"
        self.speed = speed

    def synth(self, text):
        # espeak signale les mots anglais par (en)…(fr) : on garde leurs phonèmes
        # mais on retire ces marqueurs, sinon la voix les lirait comme des lettres.
        phonemes = self.k.tokenizer.phonemize(text, "fr-fr")
        phonemes = re.sub(r"\((en|fr)\)", "", phonemes)
        samples, sr = self.k.create(phonemes, voice=self.voice, speed=self.speed, is_phonemes=True)
        assert sr == SAMPLE_RATE
        return np.asarray(samples, dtype=np.float32)


class ElevenLabs:
    def __init__(self, voice, speed):
        import requests

        self.requests = requests
        self.key = os.environ.get("ELEVENLABS_API_KEY")
        if not self.key:
            sys.exit("ELEVENLABS_API_KEY manquant")
        self.voice = voice or os.environ.get("ELEVENLABS_VOICE_ID") or "21m00Tcm4TlvDq8ikWAM"
        self.speed = speed

    def synth(self, text):
        r = self.requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice}",
            headers={"xi-api-key": self.key, "accept": "audio/mpeg"},
            json={
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "language_code": "fr",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "speed": self.speed},
            },
            timeout=120,
        )
        r.raise_for_status()
        with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
            f.write(r.content)
            f.flush()
            return decode(f.name)


class Say:
    def __init__(self, voice, speed):
        self.voice = voice or "Thomas"
        self.rate = str(int(175 * speed))

    def synth(self, text):
        with tempfile.NamedTemporaryFile(suffix=".aiff") as f:
            subprocess.run(["say", "-v", self.voice, "-r", self.rate, "-o", f.name, text], check=True)
            return decode(f.name)


ENGINES = {"kokoro": Kokoro, "elevenlabs": ElevenLabs, "say": Say}


def decode(path):
    """Convertit n'importe quel fichier audio en mono 24 kHz float32."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def trim(samples, threshold=0.01):
    loud = np.where(np.abs(samples) > threshold)[0]
    if len(loud) == 0:
        return samples
    pad = int(0.03 * SAMPLE_RATE)
    return samples[max(0, loud[0] - pad) : loud[-1] + pad]


def build_scene(engine, scene):
    parts, sentences, cursor = [], [], 0.0
    gap = np.zeros(int(GAP_S * SAMPLE_RATE), dtype=np.float32)
    for i, sentence in enumerate(scene["sentences"]):
        audio = trim(engine.synth(to_speech_text(sentence)))
        if i > 0:
            parts.append(gap)
            cursor += GAP_S
        length = len(audio) / SAMPLE_RATE
        sentences.append({"start": round(cursor, 3), "end": round(cursor + length, 3)})
        parts.append(audio)
        cursor += length
    track = np.concatenate(parts)
    peak = np.max(np.abs(track)) or 1.0
    track = track * (0.89 / peak)  # environ -1 dBFS
    sf.write(AUDIO_DIR / f"{scene['id']}.wav", track, SAMPLE_RATE, subtype="PCM_16")
    return {"duration": round(len(track) / SAMPLE_RATE, 3), "sentences": sentences}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", choices=ENGINES, default="kokoro")
    ap.add_argument("--voice")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--only", help="identifiant de scène, ex. S01")
    ap.add_argument("--episode", help="identifiant d'épisode, ex. E03")
    args = ap.parse_args()

    data = json.loads(NARRATION.read_text(encoding="utf-8"))
    episodes = [ep for ep in data["episodes"] if not args.episode or ep["id"] == args.episode]
    scenes = [s for ep in episodes for s in ep["scenes"]]
    if args.only:
        scenes = [s for s in scenes if s["id"] == args.only]
    if not scenes:
        sys.exit("Aucune scène sélectionnée")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    timings = json.loads(TIMINGS.read_text()) if TIMINGS.exists() else {}
    engine = ENGINES[args.engine](args.voice, args.speed)
    for scene in scenes:
        timings[scene["id"]] = build_scene(engine, scene)
        print(f"{scene['id']}: {timings[scene['id']]['duration']:.2f} s")
        TIMINGS.write_text(json.dumps(timings, indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
