# 🗄️ UserVault — 3-Tier Application with AWS RDS MySQL

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: Frontend                                        │
│  Nginx + HTML/CSS/JS  →  Port 80                        │
│  Docker container: three-tier-frontend                  │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP requests to API
┌───────────────────▼─────────────────────────────────────┐
│  TIER 2: Backend API                                     │
│  Node.js + Express  →  Port 5000                        │
│  Docker container: three-tier-backend                   │
└───────────────────┬─────────────────────────────────────┘
                    │ MySQL queries (port 3306)
┌───────────────────▼─────────────────────────────────────┐
│  TIER 3: Database                                        │
│  AWS RDS MySQL (managed, outside Docker)                │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Files to Modify Before Running

### 1. `backend/.env`
Replace all placeholder values:
```env
DB_HOST=YOUR_RDS_ENDPOINT_HERE     # From AWS Console > RDS > your DB > Endpoint
DB_PORT=3306
DB_USER=YOUR_MASTER_USERNAME
DB_PASSWORD=YOUR_MASTER_PASSWORD
DB_NAME=appdb
PORT=5000
```

### 2. `frontend/index.html` — Line ~245
```js
const API_BASE = 'http://localhost:5000/api';
// Change to your EC2/server IP when deploying:
// const API_BASE = 'http://YOUR_EC2_PUBLIC_IP:5000/api';
```

### 3. `docker-compose.yml` — Backend environment section
Same DB credentials as .env (for Docker deployment):
```yaml
- DB_HOST=YOUR_RDS_ENDPOINT
- DB_USER=YOUR_MASTER_USERNAME
- DB_PASSWORD=YOUR_MASTER_PASSWORD
- DB_NAME=appdb
```

---

## 🚀 Setup Steps

### Step 1: AWS RDS MySQL Setup
1. Go to **AWS Console → RDS → Create Database**
2. Choose **MySQL**, Free Tier eligible
3. Set **DB Identifier**, **Master Username**, **Master Password**
4. Under **Connectivity** → make sure **Public access = Yes** (for testing)
5. **VPC Security Group** → Add inbound rule: **MySQL/Aurora, port 3306, from your IP**
6. After creation, copy the **Endpoint** from the RDS console

### Step 2: Create the Database
```sql
-- Connect to RDS via MySQL client:
mysql -h YOUR_RDS_ENDPOINT -u admin -p

-- Then run:
CREATE DATABASE appdb;
USE appdb;
-- The app will auto-create the `users` table on startup
```

### Step 3: Local Development (without Docker)
```bash
# Backend
cd backend
npm install
# Edit .env with your RDS credentials
npm start

# Frontend — open index.html in browser (or serve with live-server)
```

### Step 4: Docker Deployment
```bash
# From project root
# Edit docker-compose.yml with RDS credentials first!

docker-compose up --build -d

# Check logs
docker-compose logs -f backend

# Frontend → http://localhost
# Backend API → http://localhost:5000/api/users
```

---

## 📡 API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/health | Health check |
| GET | /api/users | Get all users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

---

## 🔒 Production Checklist
- [ ] Use environment variables (never hardcode credentials)
- [ ] Set RDS to private subnet, only allow traffic from EC2 security group
- [ ] Enable RDS encryption at rest
- [ ] Use SSL for RDS connections (`ssl.rejectUnauthorized: true`)
- [ ] Add `.env` to `.gitignore`
- [ ] Use AWS Secrets Manager for DB credentials in production
