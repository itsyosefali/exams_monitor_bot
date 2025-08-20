#!/bin/bash

echo "🚀 Academic Deadline Bot - Deployment Script"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f config.env.example ]; then
        cp config.env.example .env
        echo "📝 Please edit .env file with your credentials:"
        echo "   - TELEGRAM_BOT_TOKEN"
        echo "   - SUPABASE_URL"
        echo "   - SUPABASE_ANON_KEY"
        echo ""
        echo "Press Enter when you're ready to continue..."
        read
    else
        echo "❌ config.env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Setup database
echo "🗄️  Setting up database..."
npm run setup

if [ $? -ne 0 ]; then
    echo "⚠️  Database setup had issues. Please check the output above."
    echo "You may need to create the table manually in Supabase."
fi

# Start the bot
echo "🤖 Starting the bot..."
echo "Press Ctrl+C to stop the bot"
echo ""

npm start
