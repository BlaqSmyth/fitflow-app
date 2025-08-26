#!/bin/bash
set -e

echo "Installing all dependencies (including dev)..."
npm ci

echo "Building client with explicit config path..."
NODE_ENV=production npx vite build --config ./vite.config.js

echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Listing build output..."
ls -la dist/
ls -la client/dist/

echo "Build completed successfully!"