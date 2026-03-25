Name: Febrian Irvansyah
NPM: 2206083584

# suilens-microservice-tutorial

Microservices tutorial implementation for Assignment 1 Part 2.2.

## Run

```bash
docker compose up --build -d
```

## Migrate + Seed (from host)

```bash
(cd services/catalog-service && bun install --frozen-lockfile && bunx drizzle-kit push)
(cd services/order-service && bun install --frozen-lockfile && bunx drizzle-kit push)
(cd services/notification-service && bun install --frozen-lockfile && bunx drizzle-kit push)
(cd services/catalog-service && bun run src/db/seed.ts)
```

## Smoke Test

```bash
curl http://localhost:3001/api/lenses | jq
LENS_ID=$(curl -s http://localhost:3001/api/lenses | jq -r '.[0].id')

curl -X POST http://localhost:3002/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Febrian Irvansyah",
    "customerEmail": "2206083584@gmail.com",
    "lensId": "'"$LENS_ID"'",
    "startDate": "2025-03-01",
    "endDate": "2025-03-05"
  }' | jq

docker compose logs notification-service --tail 20
```

## OpenAPI Documentation

- Catalog Service: http://localhost:3001/swagger
- Order Service: http://localhost:3002/swagger
- Notification Service: http://localhost:3003/swagger

Dockerhub Swagger
Notification: https://hub.docker.com/repository/docker/febrianirv/suilens-notification-service/general
Order: https://hub.docker.com/repository/docker/febrianirv/suilens-order-service
Catalog: https://hub.docker.com/repository/docker/febrianirv/suilens-catalog-service

### Catalog Service
<img width="597" height="824" alt="Screenshot 2026-03-25 at 23 51 01" src="https://github.com/user-attachments/assets/1248effc-bab9-4730-9f94-8988725a5144" />


### Order Service
<img width="610" height="827" alt="Screenshot 2026-03-25 at 23 51 30" src="https://github.com/user-attachments/assets/8ee525f0-d319-4f14-bb4b-e0ae56e2b071" />

### Notification Service
<img width="593" height="668" alt="Screenshot 2026-03-25 at 23 51 49" src="https://github.com/user-attachments/assets/9731f6d8-efb8-49d5-90e1-5d79e16aab59" />


## Kubernetes Deployment

### kubectl get pods -o wide
<img width="973" height="123" alt="Screenshot 2026-03-25 at 23 52 27" src="https://github.com/user-attachments/assets/82161ef7-e661-4542-ab7c-e55ae04bcb51" />


## Stop

```bash
docker compose down
```
