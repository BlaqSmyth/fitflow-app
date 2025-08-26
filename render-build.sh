#!/bin/bash
set -e

echo "=== Render Build Script ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "Installing dependencies..."
npm install --include=dev

echo "Building client..."
NODE_ENV=production npx vite build

echo "Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Moving client build to server/public directory..."
mkdir -p dist/public
cp -r client/dist/* dist/public/

echo "Build completed successfully!"
echo "Listing build output:"
ls -la dist/
ls -la dist/public/