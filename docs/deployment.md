# Deployment Guide

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd expert-octo-umbrella
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with production values:
```env
SERVICE_NAME=school-management-api
ENV=production

USER_PORT=5111
ADMIN_PORT=5222

MONGO_URI=mongodb://mongodb:27017/school-management-api

# Generate strong secrets (min 32 characters)
LONG_TOKEN_SECRET=<your-production-long-token-secret>
SHORT_TOKEN_SECRET=<your-production-short-token-secret>
NACL_SECRET=<your-production-nacl-secret>

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Docker Deployment

### Quick Start

```bash
docker-compose up -d
```

### Using Deployment Script

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Manual Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Service Management

### Check Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
```

### Restart Services
```bash
docker-compose restart
```

### Stop Services
```bash
docker-compose down
```

### Remove All Data
```bash
docker-compose down -v
```

## Database Management

### Access MongoDB Shell
```bash
docker exec -it school-management-db mongosh
```

### Backup Database
```bash
docker exec school-management-db mongodump --out=/backup
docker cp school-management-db:/backup ./backup
```

### Restore Database
```bash
docker cp ./backup school-management-db:/backup
docker exec school-management-db mongorestore /backup
```

## Production Checklist

- [ ] Strong JWT secrets configured (min 32 characters)
- [ ] Environment variables set correctly
- [ ] MongoDB data volume configured for persistence
- [ ] Rate limiting enabled
- [ ] HTTPS/SSL configured (via reverse proxy)
- [ ] Firewall rules configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [x] Health check endpoints configured

## Monitoring

### Health Check
```bash
curl http://localhost:5111/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "school-management-api",
  "uptime": 3600.5,
  "database": "connected"
}
```

### API Documentation
```
http://localhost:5111/api-docs
```

## Troubleshooting

### Container Won't Start
```bash
docker-compose logs api
```

### Database Connection Issues
```bash
docker-compose logs mongodb
docker exec -it school-management-db mongosh --eval "db.adminCommand('ping')"
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d
```

## Security Recommendations

1. **Use HTTPS**: Deploy behind nginx/traefik with SSL
2. **Firewall**: Only expose necessary ports
3. **Secrets**: Use Docker secrets or environment variable management
4. **Updates**: Regularly update Docker images
5. **Monitoring**: Set up logging and alerting
6. **Backups**: Automate database backups

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  api:
    deploy:
      replicas: 3
```

### Load Balancer
Use nginx or traefik as reverse proxy for load balancing.
