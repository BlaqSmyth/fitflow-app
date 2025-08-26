#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Building client..."
npx vite build

echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"