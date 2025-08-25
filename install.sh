#!/bin/bash

echo "🚀 Installing Jira MCP Chat..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed  
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo "✅ npm $(npm --version) detected"
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies"
    exit 1
fi
echo ""

# Install MCP server dependencies
echo "📦 Installing MCP server dependencies..."
cd mcp-server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install MCP server dependencies"
    exit 1
fi
cd ..
echo ""

# Install client dependencies
echo "📦 Installing Next.js client dependencies..."
cd chat-client  
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi
cd ..
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit .env file with your credentials:"
    echo "   - JIRA_BASE_URL"
    echo "   - JIRA_EMAIL" 
    echo "   - JIRA_API_TOKEN"
    echo "   - GEMINI_API_KEY"
    echo ""
fi

echo "🎉 Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your credentials"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3000"
echo ""