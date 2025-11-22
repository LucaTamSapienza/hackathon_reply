#!/bin/bash

# 🏥 Pocket Council - Complete Hackathon Setup Script
# This script will help you get everything running quickly

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         🏥 POCKET COUNCIL - HACKATHON SETUP                      ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "pocket_council" ]; then
    echo "❌ Error: Please run this script from the hackathon_reply root directory"
    exit 1
fi

echo "📋 Setup Checklist:"
echo "  [ ] Python virtual environment"
echo "  [ ] Python dependencies"
echo "  [ ] Node.js dependencies"
echo "  [ ] OpenAI API key"
echo ""

# Setup Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐍 Setting up Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd backend

# Check if venv exists
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate venv
echo "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Python dependencies installed"

# Check for OpenAI key
echo ""
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: OPENAI_API_KEY not set!"
    echo ""
    echo "The demo will work, but AI agents will use fallback mode."
    echo "For full AI features, set your key:"
    echo "  export OPENAI_API_KEY=sk-your-key-here"
    echo ""
    read -p "Do you want to enter your OpenAI API key now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your OpenAI API key: " api_key
        export OPENAI_API_KEY=$api_key
        echo "✅ OpenAI API key set for this session"
        echo ""
        echo "💡 To make it permanent, add this to your ~/.zshrc:"
        echo "   export OPENAI_API_KEY=$api_key"
    fi
else
    echo "✅ OpenAI API key is set"
fi

cd ..

# Setup Frontend
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚛️  Setting up Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd pocket_council

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
    echo "✅ Node.js dependencies installed"
else
    echo "✅ Node.js dependencies already installed"
fi

cd ..

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 Quick Start Guide:"
echo ""
echo "Option 1: Run Backend Demo (No Frontend Needed)"
echo "  cd backend"
echo "  source .venv/bin/activate"
echo "  python demo_scribe_agent.py"
echo ""
echo "Option 2: Run Full Stack"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend"
echo "    source .venv/bin/activate"
echo "    uvicorn app.main:app --reload"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd pocket_council"
echo "    npm run dev"
echo ""
echo "  Then open: http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📄 HACKATHON_DEMO_GUIDE.md    - Main presentation guide"
echo "  📄 QUICK_REFERENCE.txt         - Command cheat sheet"
echo "  📄 backend/DEMO_SUMMARY.md     - Backend demo details"
echo "  📄 pocket_council/DEMO_GUIDE.md - Frontend demo details"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Good luck with your hackathon presentation! 🏆"
echo ""
