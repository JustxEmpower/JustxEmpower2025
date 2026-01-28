#!/bin/bash

# Update nginx config with increased timeouts for media conversion
cat > /etc/nginx/sites-enabled/justxempower << 'NGINX_CONFIG'
server {
    listen 80;
    server_name justxempower.com www.justxempower.com 3.87.218.112;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name justxempower.com www.justxempower.com 3.87.218.112;

    ssl_certificate /etc/letsencrypt/live/justxempower.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/justxempower.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increased timeouts for media conversion (5 minutes)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
NGINX_CONFIG

nginx -t && systemctl reload nginx && echo "NGINX_UPDATED_SUCCESSFULLY"
