# UniBestia

UniBestia — digital ecosystem for student discounts, partner offers, QR redemption validation, and platform administration.

The project is built as a monorepo and contains:

```txt
apps/
  backend       - NestJS API
  web           - Next.js client web application for students
  business-web  - Next.js business/admin web application
  mobile        - Expo React Native application, planned for the next stage

packages/
  db                 - TypeORM entities, migrations, seeds, data source
  trpc               - tRPC routers and backend API contracts
  ui                 - shared UI package
  services           - auth, Redis, webhooks and shared backend services
  analytics          - PostHog analytics package
  websockets         - WebSocket server/client utilities
  typescript-config  - shared TypeScript config
```

---

## 1. Project purpose

UniBestia helps university students receive verified student discounts from partner businesses.

Main features:

```txt
Student web:
  - landing page
  - protected home page with new and popular discounts
  - protected catalog page
  - discount detail page
  - QR redemption flow
  - profile and student verification
  - my redemptions page

Business web:
  - partner dashboard
  - partner application
  - partner locations
  - partner offers
  - partner staff management
  - admin dashboard
  - admin moderation
  - admin student verification review

Backend:
  - NestJS API
  - PostgreSQL database
  - TypeORM migrations
  - tRPC API
  - Clerk authentication
  - R2/S3-compatible media storage
  - PostHog analytics
  - Redis support
```

Mobile application is not part of the current production/demo stage.

---

## 2. Requirements

Install these tools before running the project:

```txt
Node.js
pnpm
Docker Desktop
PostgreSQL client tools, optional but useful for psql checks
```

For local demo/development, Docker Desktop is used to run infrastructure services:

```txt
PostgreSQL
Redis
```

The application packages themselves are started with `pnpm` commands, while the database and Redis run inside Docker containers.

Recommended package manager:

```txt
pnpm 10.9.0
```

Check versions:

```powershell
node -v
pnpm -v
docker version
docker ps
psql --version
```

---

## 3. Installation

From the project root:

```powershell
pnpm install
```

---

## 4. Fast setup / common scripts

The repository has common helper scripts in the root `package.json`.

Run initial local setup:

```powershell
pnpm dev:setup
```

The setup script prepares local environment files and can create or reuse Docker containers for PostgreSQL and Redis.

In the current local demo workflow, PostgreSQL and Redis are expected to run through Docker Desktop, while backend, student web and business web are started with `pnpm`.

Run all development apps together:

```powershell
pnpm dev
```

This starts all Turbo development tasks.

For a controlled demo and debugging, it is better to run services separately in different terminals:

```powershell
pnpm dev:backend
pnpm dev:web
pnpm dev:business
```

Available common commands:

```powershell
pnpm dev
pnpm dev:setup

pnpm dev:backend
pnpm dev:web
pnpm dev:business
pnpm dev:mobile

pnpm build
pnpm build:backend
pnpm build:web
pnpm build:business
pnpm build:mobile

pnpm type-check
pnpm db:setup
pnpm db:seed
pnpm redis:setup
pnpm inspect:envs
```

Recommended demo startup order:

```txt
1. pnpm install
2. pnpm dev:setup
3. pnpm --filter @repo/db migration:run
4. pnpm db:seed
5. pnpm dev:backend
6. pnpm dev:web
7. pnpm dev:business
```

---

## 5. Environment files

Create local `.env` files from examples.

### Backend

Copy:

```powershell
Copy-Item apps/backend/.env.local.example apps/backend/.env
```

Required backend variables:

```env
NODE_ENV=development
PORT=3001
BACKEND_PUBLIC_URL=http://localhost:3001

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002

DB_HOST=127.0.0.1
DB_PORT=55432
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_DATABASE=discount

CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=

POSTHOG_API_KEY=your_posthog_project_key
POSTHOG_HOST=https://app.posthog.com

R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=your_r2_bucket_name
R2_PUBLIC_BASE_URL=

SUPERADMIN_EMAILS=admin@example.com
USE_REDIS_CACHING=true
```

### Student web

Copy:

```powershell
Copy-Item apps/web/.env.example apps/web/.env
```

Required student web variables:

```env
NEXT_PUBLIC_IS_PRODUCTION=false

NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TRPC_URL=http://localhost:3001/trpc
NEXT_PUBLIC_SOCKET_PATH=/socket.io

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home

NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### Business web

Copy:

```powershell
Copy-Item apps/business-web/.env.example apps/business-web/.env
```

Required business web variables:

```env
NEXT_PUBLIC_IS_PRODUCTION=false

NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TRPC_URL=http://localhost:3001/trpc

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

Important:

```txt
Real .env files must not be committed to Git.
Only .env.example or .env.local.example files should be tracked.
```

---

## 6. Docker local infrastructure

Docker is used for local infrastructure services.

In the current local demo workflow, PostgreSQL and Redis are run in Docker containers. The application itself is not containerized for the demo: backend, student web and business web are started with `pnpm` commands.

Typical local containers:

```txt
postgres-turbo-template  - PostgreSQL database
redis-turbo-template     - Redis cache
```

Prepare local infrastructure through:

```powershell
pnpm dev:setup
```

Or run helpers directly:

```powershell
pnpm db:setup
pnpm redis:setup
```

Useful Docker checks:

```powershell
docker ps
docker ps -a
docker logs postgres-turbo-template
docker logs redis-turbo-template
```

The backend connects to PostgreSQL through values from:

```txt
apps/backend/.env
```

Example Docker-based database config:

```env
DB_HOST=127.0.0.1
DB_PORT=55432
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_DATABASE=discount
```

If PostgreSQL port is busy on Windows:

```powershell
netstat -ano | findstr :5432
netstat -ano | findstr :55432
```

For the diploma/demo scenario, Docker is required for the recommended local PostgreSQL/Redis infrastructure unless these services are installed and configured manually with the same `.env` values.

Docker is required for the recommended local demo infrastructure, but the application services are started with `pnpm` rather than being fully containerized.

---

## 7. Database setup

Make sure Docker Desktop is running and the PostgreSQL container is started.

The backend expects database connection values from:

```txt
apps/backend/.env
```

Example:

```env
DB_HOST=127.0.0.1
DB_PORT=55432
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_DATABASE=discount
```

Check running containers:

```powershell
docker ps
```

If the PostgreSQL container is not running, use:

```powershell
pnpm db:setup
```

You can also connect with `psql`:

```powershell
psql -U postgres -h 127.0.0.1 -p 55432
```

Inside psql, create the database manually if needed:

```sql
CREATE DATABASE discount;
```

---

## 8. Run migrations

Show migrations:

```powershell
pnpm --filter @repo/db migration:show
```

Run migrations:

```powershell
pnpm --filter @repo/db migration:run
```

Expected important migrations:

```txt
[X] AddCatalogPerformanceIndexes1777425600000
[X] AddBusinessPerformanceIndexes1777684800000
```

The project uses migrations for database schema changes.

```txt
synchronize: false
```

---

## 9. Seed demo data

Run seed:

```powershell
pnpm db:seed
```

Seed data creates demo users, universities, partners, offers, locations, redemptions and verification records.

---

## 10. Start development servers

You can start all development apps through Turbo:

```powershell
pnpm dev
```

For demo and debugging, separate terminals are recommended.

### Terminal 1 — Backend

```powershell
pnpm dev:backend
```

Backend URL:

```txt
http://localhost:3001
```

Health check:

```txt
http://localhost:3001/health
```

tRPC panel, development only:

```txt
http://localhost:3001/panel
```

### Terminal 2 — Student web

```powershell
pnpm dev:web
```

Student web URL:

```txt
http://localhost:3000
```

### Terminal 3 — Business web

```powershell
pnpm dev:business
```

Business web URL:

```txt
http://localhost:3002
```

---

## 11. Main demo pages

### Student web

```txt
/                  - landing page
/home              - protected student home
/catalog           - protected discount catalog
/offer/[slug]      - discount detail page
/profile           - student profile
/my-redemptions    - received QR codes
```

Example discount page:

```txt
http://localhost:3000/offer/coffee-lab-15
```

### Business web

```txt
/                     - business dashboard entry
/login                - login page
/partner              - partner dashboard
/partner/apply        - partner application
/partner/offers       - partner offers
/partner/locations    - partner locations
/partner/staff        - partner staff
/admin                - admin dashboard
/admin/verifications  - student verification review
/admin/offers         - offer moderation
/admin/partners       - partner moderation
/admin/users          - user management
```

---

## 12. Production-like build check

Run these commands before demo or deployment:

```powershell
pnpm --filter @repo/db type-check
pnpm --filter @repo/db build

pnpm --filter @repo/trpc type-check
pnpm --filter @repo/trpc build

pnpm --filter @repo/backend build

pnpm --filter @repo/web type-check
pnpm --filter @repo/web build

pnpm --filter @repo/business-web type-check
pnpm --filter @repo/business-web build
```

Or run all package builds through Turbo:

```powershell
pnpm build
```

---

## 13. Git cleanup before commit

Check status:

```powershell
git status
```

Do not commit:

```txt
.env
.env.local
.env.production
*.tsbuildinfo
node_modules
.next
dist
```

Search for accidental secrets:

```powershell
git grep -n "CLERK_SECRET_KEY"
git grep -n "CLERK_WEBHOOK_SECRET"
git grep -n "R2_SECRET_ACCESS_KEY"
git grep -n "POSTHOG_API_KEY"
git grep -n "sk_live"
git grep -n "sk_test"
git grep -n "phc_"
```

Example values inside `.env.example` are allowed. Real values are not allowed.

---

## 14. Production readiness notes

Current completed readiness work:

```txt
Performance:
  - client page query optimization
  - catalog query optimization
  - business router optimization
  - database indexes for catalog and business queries
  - optimized Next.js image usage
  - cleaned slow example.local image URLs

Security:
  - real .env files ignored
  - hardcoded PostHog token removed
  - CORS moved to env
  - stricter ValidationPipe enabled
  - student document upload validates PDF signature
  - media upload validates type and size
  - admin/partner access checks enabled
  - dangerous webhook secret debug log removed

Production config:
  - backend config validation enabled
  - frontend env examples cleaned
  - Next.js image domains cleaned
  - database synchronize disabled
  - migrations applied
  - Docker is used for local PostgreSQL/Redis infrastructure
  - application services are started with pnpm commands
```

Recommended future improvements:

```txt
- add rate limiting for upload and QR endpoints
- add centralized request logging
- add health checks for PostgreSQL, Redis and R2
- add CI workflow for type-check/build
- prepare real production domain env values
- prepare deployment guide
- prepare full containerized deployment if Docker production deployment is required
```

---

## 15. Useful commands

```powershell
pnpm dev
pnpm dev:setup

pnpm dev:backend
pnpm dev:web
pnpm dev:business
pnpm dev:mobile

pnpm build
pnpm build:backend
pnpm build:web
pnpm build:business
pnpm build:mobile

pnpm type-check
pnpm db:setup
pnpm db:seed
pnpm redis:setup
pnpm inspect:envs

pnpm --filter @repo/db migration:show
pnpm --filter @repo/db migration:run

docker ps
docker ps -a
docker logs postgres-turbo-template
docker logs redis-turbo-template
```

---

## 16. Current stage

Current production/demo readiness stage:

```txt
Backend:       ready for local demo
Student web:   ready for local demo
Business web:  ready for local demo
Mobile:        planned for next stage
```