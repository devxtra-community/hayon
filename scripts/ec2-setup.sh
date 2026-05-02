#!/bin/bash
# =============================================================
# EC2 Bootstrap Script — Run this ONCE after SSH-ing in
# Ubuntu 22.04 LTS
# Usage: bash ec2-setup.sh
# =============================================================

set -e  # exit on any error

echo "=========================================="
echo "  Hayon EC2 Bootstrap"
echo "=========================================="

# ----------------------------------------------------------
# 1. System update
# ----------------------------------------------------------
echo "[1/6] Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ----------------------------------------------------------
# 2. Install Docker
# ----------------------------------------------------------
echo "[2/6] Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group (no sudo needed for docker)
sudo usermod -aG docker $USER

echo "[2/6] Docker installed: $(docker --version)"
echo "[2/6] Docker Compose installed: $(docker compose version)"

# ----------------------------------------------------------
# 3. Create app directory
# ----------------------------------------------------------
echo "[3/6] Creating app directory..."
mkdir -p /home/ubuntu/hayon
mkdir -p /home/ubuntu/hayon/backend
mkdir -p /home/ubuntu/hayon/certbot/conf
mkdir -p /home/ubuntu/hayon/certbot/www

echo "[3/6] App directory ready at /home/ubuntu/hayon"

# ----------------------------------------------------------
# 4. Memory: swap file (important for t2.micro — only 1GB RAM)
# ----------------------------------------------------------
echo "[4/6] Creating 2GB swap file (critical for t2.micro)..."
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo "[4/6] Swap created and enabled"
else
  echo "[4/6] Swap already exists, skipping"
fi

# ----------------------------------------------------------
# 5. Firewall (UFW)
# ----------------------------------------------------------
echo "[5/6] Configuring firewall..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
echo "[5/6] Firewall configured"

# ----------------------------------------------------------
# 6. Git (for pulling updates)
# ----------------------------------------------------------
echo "[6/6] Installing git..."
sudo apt-get install -y git

echo ""
echo "=========================================="
echo "  Bootstrap complete!"
echo "  IMPORTANT: Log out and back in so"
echo "  docker group takes effect."
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Log out: exit"
echo "  2. SSH back in"
echo "  3. Verify: docker ps  (should work without sudo)"
echo "  4. Run: bash certbot-init.sh  (get SSL certs)"
