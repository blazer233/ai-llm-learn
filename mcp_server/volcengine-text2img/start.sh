#!/bin/bash
cd "$(dirname "$0")"
export VOLCENGINE_API_KEY="${VOLCENGINE_API_KEY:-your_api_key_here}"
./volcengine-text2img -mode http -port :8080
