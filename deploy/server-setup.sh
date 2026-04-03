#!/bin/bash
# =============================================================================
# One-time server setup — run as root via SSH
# Installs .NET 8, Node.js 20, sets up folders & PostgreSQL DB
# =============================================================================
set -e

echo "▶ Updating system packages..."
apt-get update && apt-get upgrade -y

# ─── .NET 8 Runtime ───────────────────────────────────────────────────────────
echo "▶ Installing .NET 8 runtime..."
wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb
apt-get update
apt-get install -y dotnet-runtime-8.0 aspnetcore-runtime-8.0 dotnet-sdk-8.0
dotnet --version
echo "✓ .NET 8 installed."

# ─── Node.js 20 LTS ───────────────────────────────────────────────────────────
echo "▶ Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version
echo "✓ Node.js 20 installed."

# ─── PostgreSQL ───────────────────────────────────────────────────────────────
echo "▶ Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
echo "✓ PostgreSQL installed."

# ─── Create DB & user ─────────────────────────────────────────────────────────
echo "▶ Creating database..."
sudo -u postgres psql <<SQL
CREATE USER woodenhouses_user WITH PASSWORD 'CHANGE_THIS_DB_PASSWORD';
CREATE DATABASE woodenhouses_db OWNER woodenhouses_user;
GRANT ALL PRIVILEGES ON DATABASE woodenhouses_db TO woodenhouses_user;
SQL
echo "✓ Database created."

# ─── Apache modules ───────────────────────────────────────────────────────────
echo "▶ Enabling Apache modules..."
a2enmod proxy proxy_http proxy_html headers rewrite ssl
systemctl restart apache2
echo "✓ Apache modules enabled."

# ─── Deployment directories ───────────────────────────────────────────────────
echo "▶ Creating deploy directories..."
useradd -r -s /bin/false woodenhouses 2>/dev/null || true
mkdir -p /var/www/woodenhouses-api
mkdir -p /var/www/woodenhouses-frontend
mkdir -p /var/www/repo
chown -R woodenhouses:woodenhouses /var/www/woodenhouses-api
chown -R woodenhouses:woodenhouses /var/www/woodenhouses-frontend

# Uploads folder
mkdir -p /var/www/woodenhouses-api/wwwroot/uploads/{projects,services}
chown -R woodenhouses:woodenhouses /var/www/woodenhouses-api/wwwroot
echo "✓ Directories created."

# ─── Clone repo ───────────────────────────────────────────────────────────────
echo "▶ Cloning repository..."
cd /var/www/repo
git clone https://github.com/YOUR_USERNAME/wooden-houses-kenya.git
echo "✓ Repository cloned."

# ─── Install systemd services ─────────────────────────────────────────────────
echo "▶ Installing systemd services..."
cp /var/www/repo/wooden-houses-kenya/deploy/backend.service  /etc/systemd/system/woodenhouses-api.service
cp /var/www/repo/wooden-houses-kenya/deploy/frontend.service /etc/systemd/system/woodenhouses-frontend.service
systemctl daemon-reload
systemctl enable woodenhouses-api
systemctl enable woodenhouses-frontend
echo "✓ Systemd services installed."

echo ""
echo "══════════════════════════════════════════════════"
echo "Server setup complete!"
echo ""
echo "NEXT STEPS:"
echo "  1. Edit /etc/systemd/system/woodenhouses-api.service"
echo "     → Set real DB password, JWT key, email password"
echo "  2. Copy Apache configs:"
echo "     cp deploy/apache-api.conf      /etc/apache2/sites-available/"
echo "     cp deploy/apache-frontend.conf /etc/apache2/sites-available/"
echo "     a2ensite api.woodenhouseskenya.com.conf"
echo "     a2ensite woodenhouseskenya.com.conf"
echo "  3. Install SSL certificates:"
echo "     certbot --apache -d woodenhouseskenya.com -d www.woodenhouseskenya.com -d admin.woodenhouseskenya.com -d api.woodenhouseskenya.com"
echo "  4. Run: bash /var/www/repo/wooden-houses-kenya/deploy/deploy.sh"
echo "══════════════════════════════════════════════════"
