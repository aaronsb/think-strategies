#!/bin/bash
set -e

# Ensure the host directory exists with correct permissions
HOST_DATA_DIR="$HOME/Documents/thinking"
mkdir -p "$HOST_DATA_DIR"
# Ensure the directory is owned by the current user
chown -R $(id -u):$(id -g) "$HOST_DATA_DIR"

# Run local development image with provided environment variables
docker run --rm -i \
  -v "$HOST_DATA_DIR":/app/data \
  -e STORAGE_PATH=/app/data \
  sequentialthinking-plus:local
