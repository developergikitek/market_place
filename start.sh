#!/usr/bin/env bash

# ==============================================================================
# BuildMart Marketplace - Unified Fullstack Dev Runner (Backend + Frontend)
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${PURPLE}================================================================${NC}"
echo -e "${PURPLE}       🏗️  BuildMart Marketplace - Starting Dev Servers         ${NC}"
echo -e "${PURPLE}================================================================${NC}"

# Optional SSH tunnel for remote PostgreSQL (does not crash if offline)
LOCAL_TUNNEL_PORT=5433
EC2_USER="ec2-user"
EC2_HOST="3.7.254.54"
SSH_KEY="$HOME/.ssh/id_rsa"

if [ -f "$SSH_KEY" ]; then
    if lsof -Pi :$LOCAL_TUNNEL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ SSH tunnel already running on port $LOCAL_TUNNEL_PORT.${NC}"
    else
        echo -e "${YELLOW}🔐 Attempting optional SSH tunnel to AWS PostgreSQL...${NC}"
        ssh -i "$SSH_KEY" -f -N \
            -o ExitOnForwardFailure=no \
            -o ConnectTimeout=3 \
            -L "${LOCAL_TUNNEL_PORT}:localhost:5432" \
            "${EC2_USER}@${EC2_HOST}" 2>/dev/null || true
    fi
fi

# Cleanup handler on exit (Ctrl+C)
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all servers...${NC}"
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    # Free ports if still occupied
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ All processes stopped cleanly.${NC}"
    exit 0
}

trap cleanup INT TERM EXIT

# Determine Python binary for backend
PYTHON_BIN="python3"
if [ -f "$BACKEND_DIR/venv/bin/python3" ]; then
    PYTHON_BIN="$BACKEND_DIR/venv/bin/python3"
elif [ -f "$BACKEND_DIR/venv/bin/python" ]; then
    PYTHON_BIN="$BACKEND_DIR/venv/bin/python"
fi

# 1. Start Django Backend
echo -e "${CYAN}🚀 [1/2] Starting Django Backend on http://127.0.0.1:8000 ...${NC}"
cd "$BACKEND_DIR"
$PYTHON_BIN manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

# Wait 2 seconds for backend to initialize
sleep 2

# 2. Start Next.js Frontend
echo -e "${CYAN}🌐 [2/2] Starting Next.js Frontend on http://localhost:3000 ...${NC}"
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}   ✨ Fullstack Environment Is Now Running!                    ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "   👉 Frontend:     ${BLUE}http://localhost:3000${NC}"
echo -e "   👉 Backend API:  ${BLUE}http://127.0.0.1:8000${NC}"
echo -e "   👉 API Docs:     ${BLUE}http://127.0.0.1:8000/api/docs/${NC}"
echo -e "   👉 Django Admin: ${BLUE}http://127.0.0.1:8000/admin/${NC}"
echo -e "${YELLOW}Press Ctrl+C anytime to stop both servers.${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""

# Wait for background processes
wait
