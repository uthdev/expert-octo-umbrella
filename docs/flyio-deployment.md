# Fly.io Deployment Guide

Complete guide to deploy the School Management System API to Fly.io with minimal cold starts.

## Why Fly.io?

- ✅ Fast cold starts (1-2 seconds vs 30-60s on Render)
- ✅ Free tier: 3 VMs (256MB RAM each)
- ✅ Docker-native deployment
- ✅ Global edge network
- ✅ Can keep always-on within free tier
- ✅ Free SSL certificates

## Prerequisites

- Fly.io account (free): https://fly.io/app/sign-up
- Fly CLI installed
- MongoDB Atlas account (free): https://cloud.mongodb.com

## Step 1: Install Fly CLI

### Windows (PowerShell)
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### macOS/Linux
```bash
curl -L https://fly.io/install.sh | sh
```

### Verify Installation
```bash
fly version
```

## Step 2: Login to Fly.io

```bash
fly auth login
```

This opens your browser for authentication.

## Step 3: Prepare MongoDB

### Option A: MongoDB Atlas (Recommended)

1. **Create Free Cluster**
   - Go to https://cloud.mongodb.com
   - Sign up / Login
   - Create new project
   - Build a Database → Free (M0) tier
   - Choose cloud provider and region (closest to your Fly.io region)

2. **Configure Database Access**
   - Database Access → Add New Database User
   - Username: `schooladmin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: Read and write to any database

3. **Configure Network Access**
   - Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirm

4. **Get Connection String**
   - Database → Connect → Connect your application
   - Copy connection string:
   ```
   mongodb+srv://schooladmin:<password>@cluster0.xxxxx.mongodb.net/school-management-api?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password

## Step 4: Launch Fly.io App

From your project root directory:

```bash
fly launch
```

**Interactive prompts:**
- **App Name:** Choose unique name (e.g., `school-mgmt-api-yourname`) or press Enter for auto-generated
- **Region:** Select closest region (e.g., `iad` for US East, `lhr` for London)
- **Would you like to set up a Postgresql database?** → **No**
- **Would you like to set up an Upstash Redis database?** → **No**
- **Would you like to deploy now?** → **No** (we need to set secrets first)

This creates `fly.toml` configuration file.

## Step 5: Configure fly.toml

Update the generated `fly.toml`:

```toml
app = "your-app-name"
primary_region = "iad"

[build]

[http_service]
  internal_port = 5111
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256

[env]
  SERVICE_NAME = "school-management-api"
  ENV = "production"
  USER_PORT = "5111"
  ADMIN_PORT = "5222"
  RATE_LIMIT_WINDOW_MS = "900000"
  RATE_LIMIT_MAX_REQUESTS = "100"
```

**Key settings:**
- `auto_stop_machines = false` - Prevents cold starts
- `min_machines_running = 1` - Keeps 1 VM always-on
- `internal_port = 5111` - Matches your app port

## Step 6: Set Secrets

Set environment secrets (never commit these!):

```bash
# MongoDB connection
fly secrets set MONGO_URI="mongodb+srv://schooladmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/school-management-api?retryWrites=true&w=majority"

# JWT secrets (generate strong 32+ character secrets)
fly secrets set LONG_TOKEN_SECRET="your-long-token-secret-min-32-chars"
fly secrets set SHORT_TOKEN_SECRET="your-short-token-secret-min-32-chars"
fly secrets set NACL_SECRET="your-nacl-secret-min-32-chars"
```

**Generate secure secrets:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Step 7: Deploy

```bash
fly deploy
```

This builds your Docker image and deploys to Fly.io.

**Deployment process:**
1. Builds Docker image from Dockerfile
2. Pushes to Fly.io registry
3. Creates VM and starts app
4. Runs health checks

## Step 8: Verify Deployment

### Check Status
```bash
fly status
```

### View Logs
```bash
fly logs
```

### Open App
```bash
fly open
```

### Test Endpoints

**Health Check:**
```bash
curl https://your-app.fly.dev/api/health
```

**Swagger Docs:**
```
https://your-app.fly.dev/api-docs
```

**Login:**
```bash
curl -X POST https://your-app.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'
```

## Step 9: Seed Database

SSH into your Fly.io VM and run seed script:

```bash
fly ssh console
cd /app
node tests/integration/seed.js
exit
```

Or run locally pointing to production MongoDB:
```bash
MONGO_URI="your-production-mongo-uri" node tests/integration/seed.js
```

## Management Commands

### View App Info
```bash
fly info
```

### Scale VMs
```bash
# Keep 1 VM always running (no cold starts)
fly scale count 1

# Scale to 2 VMs for redundancy
fly scale count 2
```

### Update Secrets
```bash
fly secrets set KEY="value"
```

### View Secrets
```bash
fly secrets list
```

### Restart App
```bash
fly apps restart
```

### SSH into VM
```bash
fly ssh console
```

### View Metrics
```bash
fly dashboard
```

## Monitoring

### Health Check Endpoint
Fly.io automatically monitors `/api/health` endpoint.

### View Logs (Real-time)
```bash
fly logs -f
```

### Check VM Status
```bash
fly status
```

## Troubleshooting

### App Won't Start
```bash
# Check logs
fly logs

# Common issues:
# - MongoDB connection string incorrect
# - Secrets not set
# - Port mismatch in fly.toml
```

### Database Connection Failed
```bash
# Verify MongoDB Atlas:
# 1. IP whitelist includes 0.0.0.0/0
# 2. Database user has correct permissions
# 3. Connection string has correct password
# 4. Database name is correct

# Test connection from VM
fly ssh console
curl -I https://cloud.mongodb.com
```

### Cold Starts Still Happening
```bash
# Ensure auto_stop_machines = false in fly.toml
# Ensure min_machines_running = 1

# Redeploy
fly deploy
```

### Out of Memory
```bash
# Increase VM memory (uses more free tier credits)
fly scale memory 512
```

## Cost Optimization

### Free Tier Limits
- 3 shared-cpu VMs (256MB RAM each)
- 160GB outbound data transfer/month
- 3GB persistent storage

### Staying Within Free Tier
```bash
# Use 1 VM (256MB) - enough for this API
fly scale count 1 --region iad

# Use MongoDB Atlas free tier (512MB)
# Total cost: $0/month
```

### Monitor Usage
```bash
fly dashboard
# View usage at: https://fly.io/dashboard/personal/billing
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Setup:**
1. Get Fly.io API token: `fly auth token`
2. Add to GitHub Secrets: `FLY_API_TOKEN`
3. Push to main branch → Auto-deploy

## Custom Domain

### Add Domain
```bash
fly certs add yourdomain.com
```

### DNS Configuration
Add these records to your DNS provider:
```
A     @     <fly-ip-address>
AAAA  @     <fly-ipv6-address>
```

Get IP addresses:
```bash
fly ips list
```

## Backup Strategy

### MongoDB Atlas Backups
- Automatic daily backups (free tier)
- Point-in-time recovery available

### Manual Backup
```bash
# From local machine
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore
mongorestore --uri="mongodb+srv://..." ./backup
```

## Security Checklist

- [x] Strong JWT secrets (32+ characters)
- [x] MongoDB Atlas IP whitelist configured
- [x] HTTPS enforced (automatic with Fly.io)
- [x] Secrets stored in Fly.io (not in code)
- [x] Rate limiting enabled (100 req/15min)
- [x] Health check endpoint configured

## Support

- **Fly.io Docs:** https://fly.io/docs
- **Community Forum:** https://community.fly.io
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com

## Summary

**Your app is now live at:**
- API: `https://your-app.fly.dev/api`
- Swagger: `https://your-app.fly.dev/api-docs`
- Health: `https://your-app.fly.dev/api/health`

**Key benefits:**
- ✅ No cold starts (always-on VM)
- ✅ Free tier sustainable
- ✅ Global edge deployment
- ✅ Automatic SSL
- ✅ Easy updates with `fly deploy`
