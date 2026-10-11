#!/usr/bin/env bash

set -e

LOCAL_PORT=5433
EC2_USER="ec2-user"
EC2_HOST="3.7.254.54"
SSH_KEY="$HOME/.ssh/id_rsa"

if lsof -Pi :$LOCAL_PORT -sTCP:LISTEN -t >/dev/null; then
    echo "🔒 SSH tunnel is already running on port $LOCAL_PORT."
else
    echo "🔐 Starting SSH tunnel in background..."
    ssh -i "$SSH_KEY" -f -N \
        -o ExitOnForwardFailure=yes \
        -L "${LOCAL_PORT}:localhost:5432" \
        "${EC2_USER}@${EC2_HOST}"
    echo "✅ Tunnel started."
fi

echo "🚀 PostgreSQL tunnel is ready on port $LOCAL_PORT."

cd backend
source venv/bin/activate
python3 manage.py runserver
