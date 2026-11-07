#!/bin/sh
set -eu
export XDG_DATA_HOME=/workspace/godot-data
export XDG_CONFIG_HOME=/workspace/godot-config
export XDG_CACHE_HOME=/workspace/.cache
export ANDROID_HOME=/workspace/android-toolchain/sdk
export ANDROID_SDK_ROOT=/workspace/android-toolchain/sdk
export ANDROID_USER_HOME=/workspace/android-toolchain/user
cd /workspace/codex
mkdir -p build
exec godot "$@"
