#!/bin/bash

# Stop on errors
set -e

echo "🧹 Cleaning node_modules and caches..."
rm -rf node_modules
rm -rf .yarn
rm -f yarn.lock
rm -f package-lock.json

echo "🧪 Installing dependencies with yarn..."
yarn install

echo "🔨 Building the widget..."
yarn build

echo "✅ Done!" 