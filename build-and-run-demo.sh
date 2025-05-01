#!/bin/bash

# Stop on errors
set -e

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building the widget..."
npm run build

echo "🚀 Starting demo server..."
npm run serve-demo 