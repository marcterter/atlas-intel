#!/usr/bin/env bash
# Installe le moteur de voix off local (Kokoro) et télécharge ses poids.
set -euo pipefail
cd "$(dirname "$0")"
pip install kokoro-onnx soundfile numpy requests
mkdir -p models
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f models/kokoro-v1.0.onnx ] || curl -L -o models/kokoro-v1.0.onnx "$base/kokoro-v1.0.onnx"
[ -f models/voices-v1.0.bin ] || curl -L -o models/voices-v1.0.bin "$base/voices-v1.0.bin"
command -v ffmpeg >/dev/null || echo "Attention : ffmpeg est requis (apt install ffmpeg / brew install ffmpeg)"
