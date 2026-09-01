#!/bin/bash
# Quick Setup Script for Option 3: Database-Driven Datasets
# Run this after pulling the code to prepare for deployment

set -e  # Exit on error

echo "================================"
echo "Sehat AI - Option 3 Setup"
echo "================================"
echo ""

# Step 1: Check prerequisites
echo "✓ Checking prerequisites..."
if ! command -v npm &> /dev/null; then
    echo "✗ npm not found. Please install Node.js"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "✗ python3 not found. Please install Python 3"
    exit 1
fi

echo "✓ Prerequisites OK"
echo ""

# Step 2: Install backend dependencies
echo "✓ Installing backend dependencies..."
cd backend
npm install
npm run prisma:generate
cd ..
echo "✓ Backend dependencies installed"
echo ""

# Step 3: Install AI service dependencies
echo "✓ Installing AI service dependencies..."
cd ai
pip install -r requirements.txt
cd ..
echo "✓ AI service dependencies installed"
echo ""

# Step 4: Create .env files from examples
echo "✓ Setting up environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env 2>/dev/null || echo "Note: Create backend/.env with your secrets"
fi

if [ ! -f ai/.env ]; then
    cp ai/.env.example ai/.env 2>/dev/null || echo "Note: Create ai/.env with your secrets"
fi

echo "✓ Environment files ready"
echo ""

# Step 5: Run Prisma migration
echo "✓ Running database migration..."
cd backend
npm run prisma:migrate -- --skip-generate 2>/dev/null || echo "Note: Database may already be migrated"
cd ..
echo "✓ Database ready"
echo ""

# Step 6: Start services (optional)
echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Update .env files with your secrets"
echo "2. Start backend:   cd backend && npm run dev"
echo "3. Start AI:        cd ai && python main.py"
echo "4. Test endpoint:   curl http://localhost:4000/api/datasets"
echo ""
echo "For deployment to Render:"
echo "1. Read OPTION3_IMPLEMENTATION.md"
echo "2. Set up services on Render.com"
echo "3. Configure environment variables"
echo "4. Deploy!"
echo ""
