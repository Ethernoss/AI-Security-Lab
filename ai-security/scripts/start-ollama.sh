#!/bin/bash

LAB_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export OLLAMA_MODELS="${OLLAMA_MODELS:-$LAB_ROOT/storage/ollama}"

echo "Ollama model storage:"
echo "$OLLAMA_MODELS"

ollama serve
