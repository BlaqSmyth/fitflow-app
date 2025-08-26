#!/bin/bash
set -e

echo "=== Render Build Script ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo "Installing dependencies..."
npm install --include=dev

echo "Building application..."
npm run build

echo "Build completed successfully!"
echo "Listing build output:"
ls -la dist/