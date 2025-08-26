#!/bin/bash
set -e

echo "Building client..."
vite build

echo "Building server..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"