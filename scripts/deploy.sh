#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Build and start containers
echo "🐳 Building Docker containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "✅ Checking service health..."
docker-compose ps

echo "🎉 Deployment complete!"
echo "📊 API running at http://localhost:5111"
echo "📚 Swagger docs at http://localhost:5111/api-docs"
