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

# SSH tunnel to the AWS PostgreSQL database (required: the backend has no other database)
LOCAL_TUNNEL_PORT=5433
EC2_USER="ec2-user"
EC2_HOST="3.7.254.54"

# Check available SSH keys
SSH_KEY=""
for key_candidate in "$HOME/.ssh/id_rsa" "$HOME/.ssh/id_ed25519" "$HOME/.ssh"/*.pem; do
    if [ -f "$key_candidate" ]; then
        SSH_KEY="$key_candidate"
        break
    fi
done

if lsof -Pi :$LOCAL_TUNNEL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ SSH tunnel already running on port $LOCAL_TUNNEL_PORT.${NC}"
elif [ -n "$SSH_KEY" ]; then
    echo -e "${YELLOW}🔐 Opening SSH tunnel to AWS PostgreSQL using $(basename "$SSH_KEY")...${NC}"
    ssh -i "$SSH_KEY" -f -N \
        -o ExitOnForwardFailure=yes \
        -o ConnectTimeout=8 \
        -o ServerAliveInterval=30 \
        -o ServerAliveCountMax=3 \
        -o StrictHostKeyChecking=no \
        -L "${LOCAL_TUNNEL_PORT}:localhost:5432" \
        "${EC2_USER}@${EC2_HOST}"
fi

if ! lsof -Pi :$LOCAL_TUNNEL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗ No database tunnel on port $LOCAL_TUNNEL_PORT, so the backend can't reach PostgreSQL.${NC}"
    echo -e "${RED}  Open it yourself and run this script again:${NC}"
    echo -e "    ssh -i <your-ec2-key.pem> -N -o ServerAliveInterval=30 -L ${LOCAL_TUNNEL_PORT}:localhost:5432 ${EC2_USER}@${EC2_HOST}"
    exit 1
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

if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "${RED}⚠️  Django Backend failed to keep running on port 8000. Run 'python manage.py runserver' in backend/ to inspect error.${NC}"
else
    echo -e "${GREEN}✓ Django Backend started successfully (PID: $BACKEND_PID)${NC}"
fi

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
