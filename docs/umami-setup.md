# Self-Hosted Umami Analytics Setup for AWS

This guide walks you through setting up Umami analytics on your AWS EC2 server.

## Prerequisites

- AWS EC2 instance (your existing server)
- Docker and Docker Compose installed
- A domain or subdomain for analytics (e.g., `analytics.justxempower.com`)

## Quick Setup

### 1. Install Docker (if not already installed)

```bash
# Update packages
sudo yum update -y  # Amazon Linux
# or
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Docker
sudo yum install -y docker  # Amazon Linux
# or
sudo apt install -y docker.io  # Ubuntu

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER
```

### 2. Install Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. Create Umami Directory

```bash
mkdir -p /opt/umami
cd /opt/umami
```

### 4. Create Docker Compose File

Create `/opt/umami/docker-compose.yml`:

```yaml
version: '3'
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    ports:
      - "3001:3000"
    environment:
      DATABASE_URL: postgresql://umami:umami_password_change_me@db:5432/umami
      DATABASE_TYPE: postgresql
      APP_SECRET: replace_me_with_random_string_at_least_32_chars
    depends_on:
      db:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/heartbeat || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: umami
      POSTGRES_USER: umami
      POSTGRES_PASSWORD: umami_password_change_me
    volumes:
      - umami-db-data:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umami -d umami"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  umami-db-data:
```

### 5. Generate Secure Secrets

```bash
# Generate APP_SECRET
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

Update the `docker-compose.yml` with your generated secrets.

### 6. Start Umami

```bash
cd /opt/umami
docker-compose up -d
```

### 7. Access Umami

- URL: `http://your-server-ip:3001`
- Default login: `admin` / `umami`
- **IMPORTANT**: Change the default password immediately!

### 8. Add Your Website

1. Log into Umami
2. Go to Settings → Websites → Add website
3. Enter:
   - Name: `Just Empower`
   - Domain: `justxempower.com` (or your domain)
4. Copy the **Website ID** (a UUID like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 9. Configure Nginx Reverse Proxy (Recommended)

Add to your Nginx config:

```nginx
server {
    listen 80;
    server_name analytics.justxempower.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then get SSL with Certbot:
```bash
sudo certbot --nginx -d analytics.justxempower.com
```

## Configure JustxEmpower Website

After Umami is running, you need to set these environment variables:

```bash
VITE_ANALYTICS_ENDPOINT=https://analytics.justxempower.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id-from-umami
```

### For Production (PM2)

Edit your PM2 ecosystem file or set environment variables:

```bash
# In /var/www/justxempower
pm2 set justxempower:VITE_ANALYTICS_ENDPOINT "https://analytics.justxempower.com"
pm2 set justxempower:VITE_ANALYTICS_WEBSITE_ID "your-website-id"
pm2 restart justxempower
```

Or create/edit `.env` file in production:
```
VITE_ANALYTICS_ENDPOINT=https://analytics.justxempower.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

## Alternative: Use Existing MySQL Database

If you prefer to use your existing RDS MySQL database instead of PostgreSQL:

```yaml
version: '3'
services:
  umami:
    image: ghcr.io/umami-software/umami:mysql-latest
    ports:
      - "3001:3000"
    environment:
      DATABASE_URL: mysql://umami_user:password@your-rds-endpoint:3306/umami
      DATABASE_TYPE: mysql
      APP_SECRET: replace_me_with_random_string
    restart: always
```

You'll need to:
1. Create a new database `umami` in your RDS instance
2. Create a user with access to that database
3. Update the connection string

## Troubleshooting

### Check if Umami is running
```bash
docker-compose ps
docker-compose logs umami
```

### Restart Umami
```bash
docker-compose restart
```

### View logs
```bash
docker-compose logs -f umami
```

### Reset admin password
```bash
docker-compose exec umami npx prisma db execute --stdin <<< "UPDATE account SET password = '\$2b\$10\$BUli0c.muyCW1ErNJc3jL.vFRFtFJWrT8/GcR4A.sUdCznaXiqFXa' WHERE username = 'admin';"
```
This resets the password to `umami`.

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated unique APP_SECRET
- [ ] Generated unique database password
- [ ] Set up SSL/HTTPS via Nginx + Certbot
- [ ] Configured firewall to only allow ports 80, 443, 22
- [ ] Regular backups of umami-db-data volume
