#!/usr/bin/env bash
set -euo pipefail
SDK="$(xcrun --show-sdk-path)"   # ensure correct macOS SDK
swiftc -O -sdk "$SDK" -o scripts/ocr_vision scripts/ocr_vision.swift
echo "Built scripts/ocr_vision"