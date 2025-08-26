#!/bin/bash
set -e

echo "Installing all dependencies (including dev)..."
npm ci

echo "Building client with our existing root vite.config.js..."
NODE_ENV=production npx vite build

echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"