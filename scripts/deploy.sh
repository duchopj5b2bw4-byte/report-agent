#!/bin/bash
set -e

# Alibaba Cloud ECS Deployment Script
# Usage: DASHSCOPE_API_KEY=sk-xxx ./scripts/deploy.sh <server-ip> [ssh-key-path]

SERVER_IP=${1:?"Usage: $0 <server-ip> [ssh-key-path]"}
SSH_KEY=${2:-"~/.ssh/id_rsa"}
DASHSCOPE_API_KEY=${DASHSCOPE_API_KEY:?"DASHSCOPE_API_KEY is required"}

echo "Building Docker image..."
docker build -t report-agent:latest .

echo "Saving image..."
docker save report-agent:latest | gzip > report-agent.tar.gz

echo "Uploading to server..."
scp -i "$SSH_KEY" report-agent.tar.gz docker-compose.yml root@$SERVER_IP:/opt/report-agent/

echo "Deploying on server..."
ssh -i "$SSH_KEY" root@$SERVER_IP << 'EOF'
  cd /opt/report-agent
  docker load < report-agent.tar.gz
  export DASHSCOPE_API_KEY="$DASHSCOPE_API_KEY"
  docker compose up -d
  rm report-agent.tar.gz
  echo "Deployed! App running on port 3000"
EOF

rm report-agent.tar.gz
echo "Done."