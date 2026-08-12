# FECOS API

Spring Boot 3 + Java 21 backend for FECOS ERP.

## Prerequisites

- Java 21
- Maven 3.9+
- Docker + Docker Compose

## Quick Start

### 1. Start MySQL with Docker

```bash
docker compose up -d
```

MySQL → `localhost:3306` / db: `fecos_dev` / user: `root` / password: `fecos123`
Adminer UI → http://localhost:8081

### 2. Run the API

```bash
./mvnw spring-boot:run
```

API runs at http://localhost:8080

## Environment Variables

| Variable | Default (dev) | Required in prod |
|---|---|---|
| `DB_HOST` | `localhost` | yes |
| `DB_USER` | `root` | yes |
| `DB_PASSWORD` | `fecos123` | yes |
| `JWT_SECRET` | dev fallback | **yes — change in prod** |
| `AWS_REGION` | `us-east-1` | yes |
| `AWS_S3_BUCKET` | `fecos-dev-bucket` | yes |
| `FIREBASE_CREDENTIALS_PATH` | (empty) | yes |

## Profiles

```bash
# dev (default — localhost MySQL)
./mvnw spring-boot:run

# staging
./mvnw spring-boot:run -Dspring.profiles.active=staging

# prod
./mvnw spring-boot:run -Dspring.profiles.active=prod
```

## Public Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/tenant/config` | Tenant branding config (no auth) |
| POST | `/api/auth/login` | Login (no auth) |
| GET | `/actuator/health` | Health check |
| GET | `/swagger-ui.html` | API docs |

## Tenant Resolution

Subdomain from `Host` header → `endura.fecoserp.com` resolves tenant "endura".
On localhost the tenant filter is a no-op; the config endpoint defaults to "endura".
