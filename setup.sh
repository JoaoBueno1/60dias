#!/bin/bash

echo "🚀 Personal Finance Hub - Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    else
        # Linux
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    fi
    
    echo "✅ .env file created with secure JWT_SECRET"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 You can now run:"
echo "   npm run dev    # Start development server"
echo ""
echo "📱 Then open http://localhost:3000 and register your account!"
