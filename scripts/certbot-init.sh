#!/bin/bash
# =============================================================
# Certbot Bootstrap — Run this ONCE on the EC2 after DNS is live
#
# Pre-requisites:
#   1. DNS is pointing to this EC2 (nslookup hayon.site returns EC2 IP)
#   2. Docker is installed (ran ec2-setup.sh)
#   3. Directories exist: /home/ubuntu/hayon/certbot/{conf,www} and nginx/
#
# What it does:
#   Phase 1 → Start a throwaway nginx on port 80 (no compose, no images needed)
#   Phase 2 → Run certbot to get certs for hayon.site + api.hayon.site
#   Phase 3 → Stop throwaway nginx (real app starts via CD pipeline)
# =============================================================

set -e

APP_DIR="/home/ubuntu/hayon"
EMAIL="hayon.app@gmail.com"   # ← used for cert expiry alerts from Let's Encrypt

echo "=========================================="
echo "  Certbot SSL Bootstrap"
echo "=========================================="

# Verify directories exist
mkdir -p $APP_DIR/certbot/conf
mkdir -p $APP_DIR/certbot/www
mkdir -p $APP_DIR/nginx

# ----------------------------------------------------------
# Phase 1: Start a temporary standalone nginx on port 80
# Uses docker run directly — no compose file needed yet
# ----------------------------------------------------------
echo ""
echo "[Phase 1] Starting temporary HTTP nginx..."

# Write a minimal HTTP-only nginx config
cat > /tmp/nginx-bootstrap.conf << 'EOF'
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name hayon.site www.hayon.site api.hayon.site;

        # Let's Encrypt ACME challenge
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'Hayon — SSL setup in progress...';
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Kill any existing container on port 80
docker stop temp_nginx 2>/dev/null && docker rm temp_nginx 2>/dev/null || true

docker run -d \
  --name temp_nginx \
  -p 80:80 \
  -v /tmp/nginx-bootstrap.conf:/etc/nginx/nginx.conf:ro \
  -v $APP_DIR/certbot/www:/var/www/certbot \
  nginx:1.27-alpine

echo "[Phase 1] Temporary nginx running on port 80"
echo "           Verifying: curl http://hayon.site"
sleep 3
curl -s http://hayon.site || echo "Warning: curl failed — check DNS is pointing here"

# ----------------------------------------------------------
# Phase 2: Get SSL certificates
# ----------------------------------------------------------
echo ""
echo "[Phase 2] Getting cert for hayon.site + www.hayon.site..."

docker run --rm \
  -v $APP_DIR/certbot/conf:/etc/letsencrypt \
  -v $APP_DIR/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d hayon.site \
  -d www.hayon.site

echo ""
echo "[Phase 2] Getting cert for api.hayon.site..."

docker run --rm \
  -v $APP_DIR/certbot/conf:/etc/letsencrypt \
  -v $APP_DIR/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d api.hayon.site

# ----------------------------------------------------------
# Phase 3: Stop throwaway nginx — the real app starts via CD push
# ----------------------------------------------------------
echo ""
echo "[Phase 3] Stopping temporary nginx..."
docker stop temp_nginx && docker rm temp_nginx

echo ""
echo "=========================================="
echo "  SSL certificates obtained!"
echo ""
ls $APP_DIR/certbot/conf/live/
echo ""
echo "  Next step: push to main branch to trigger"
echo "  the GitHub Actions CD pipeline."
echo "  It will pull images and start all services."
echo "=========================================="
