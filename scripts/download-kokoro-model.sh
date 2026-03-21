#!/bin/bash
set -e
MODEL_DIR=/var/www/justxempower/dist/public/models/kokoro
mkdir -p "$MODEL_DIR/onnx"
cd "$MODEL_DIR"
BASE=https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main

echo "Downloading config files..."
curl -sL -o config.json "$BASE/config.json"
curl -sL -o tokenizer.json "$BASE/tokenizer.json"
curl -sL -o tokenizer_config.json "$BASE/tokenizer_config.json"

echo "Downloading q4 ONNX model (~45MB)..."
curl -L -o onnx/model_q4.onnx "$BASE/onnx/model_q4.onnx"

echo "Downloading voice files..."
for v in af_heart af_bella af_kore af_nicole am_adam am_michael bf_emma bm_george; do
  curl -sL -o "voices_${v}.bin" "$BASE/voices/${v}.bin" &
done
wait

ls -lh . onnx/
echo "MODEL_DOWNLOAD_DONE"
