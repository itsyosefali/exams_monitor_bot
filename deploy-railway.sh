#!/bin/bash

echo "🚀 Railway Deployment Script"
echo "============================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Railway CLI"
        echo "Please install manually: npm install -g @railway/cli"
        exit 1
    fi
fi

echo "✅ Railway CLI installed"

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

if [ $? -ne 0 ]; then
    echo "❌ Failed to login to Railway"
    exit 1
fi

# Initialize Railway project
echo "🚧 Initializing Railway project..."
railway init

# Add environment variables
echo "🔧 Adding environment variables..."
echo ""
echo "Please add these environment variables in Railway dashboard:"
echo "TELEGRAM_BOT_TOKEN=your_bot_token_here"
echo "SUPABASE_URL=your_supabase_project_url"
echo "SUPABASE_ANON_KEY=your_supabase_anon_key"
echo "NOTIFICATION_HOURS_BEFORE=24"
echo "NOTIFICATION_HOURS_BEFORE_CRITICAL=2"
echo ""

echo "Press Enter when you've added the environment variables..."
read

# Deploy
echo "🚀 Deploying to Railway..."
railway up

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your bot is now running on Railway!"
    echo "📱 Test it by sending /start to your bot on Telegram"
else
    echo "❌ Deployment failed"
    echo "Check the logs: railway logs"
fi
