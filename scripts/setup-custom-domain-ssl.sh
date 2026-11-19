#!/usr/bin/env bash
set -e

DOMAIN="${1:-hawazin.shop}"
INCLUDE_WWW="${2:-true}"

# Sanitize domain
DOMAIN=$(echo "$DOMAIN" | tr '[:upper:]' '[:lower:]' | sed -E 's|^https?://||' | sed -E 's|/.*||' | tr -d ' ' | sed 's/[^a-z0-9.-]//g')

if [ -z "$DOMAIN" ]; then
  echo "❌ Error: Invalid domain name"
  exit 1
fi

echo "🚀 [SSL] Starting SSL issuance for domain: $DOMAIN (include_www: $INCLUDE_WWW)..."

# 1. Prepare webroot ACME challenge directory
sudo mkdir -p /var/www/frontend2/dist/.well-known/acme-challenge
sudo chmod -R 755 /var/www/frontend2/dist/.well-known

# 2. Build certbot flags
CERTBOT_FLAGS="-d $DOMAIN"
SERVER_NAMES="$DOMAIN"
if [ "$INCLUDE_WWW" = "true" ]; then
  CERTBOT_FLAGS="$CERTBOT_FLAGS -d www.$DOMAIN"
  SERVER_NAMES="$SERVER_NAMES www.$DOMAIN"
fi

# 3. Request SSL Certificate
echo "🔒 Requesting certificate from Let's Encrypt for: $CERTBOT_FLAGS..."
sudo certbot certonly --webroot -w /var/www/frontend2/dist \
  $CERTBOT_FLAGS \
  --non-interactive \
  --agree-tos \
  --email admin@maxp.online \
  --expand

CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

if [ ! -f "$CERT_PATH" ]; then
  echo "❌ Error: Certificate not found at $CERT_PATH"
  exit 1
fi

echo "✅ Certificate obtained successfully at $CERT_PATH"

# 4. Write Nginx server block
CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN.conf"
echo "⚙️ Writing Nginx configuration to $CONFIG_FILE..."

sudo tee "$CONFIG_FILE" > /dev/null << NGINX_CONF
server {
    listen 80;
    server_name $SERVER_NAMES;

    location /.well-known/acme-challenge/ {
        root /var/www/frontend2/dist;
        allow all;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $SERVER_NAMES;

    ssl_certificate $CERT_PATH;
    ssl_certificate_key $KEY_PATH;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/frontend2/dist;
    index index.html;

    client_max_body_size 100M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location ^~ /assets/ {
        try_files \$uri =404;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location ^~ /uploads/ {
        alias /var/www/backend2/uploads/;
        access_log off;
        add_header Cache-Control "public, max-age=2592000" always;
        add_header Access-Control-Allow-Origin "*" always;
    }

    location ~* \.(?:css|js|mjs|map|json|webmanifest|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$ {
        try_files \$uri =404;
        access_log off;
        add_header Cache-Control "public, max-age=2592000" always;
    }

    location / {
        proxy_pass http://maxp_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Subdomain \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_next_upstream error timeout http_502;
        proxy_next_upstream_tries 2;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }

    location ^~ /api/v1/ {
        proxy_pass http://maxp_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    location ^~ /api/ {
        rewrite ^/api/(.*)$ /api/v1/\$1 break;
        proxy_pass http://maxp_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /socket.io/ {
        proxy_pass http://maxp_backend/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_CONF

# 5. Link to sites-enabled
sudo ln -sf "$CONFIG_FILE" "/etc/nginx/sites-enabled/$DOMAIN.conf"

# 6. Test Nginx and reload
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "🎉 [SUCCESS] SSL and Nginx successfully configured and active for $DOMAIN!"
