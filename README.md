# Bitespeed Identity Reconciliation 

This service implements the `/identify` endpoint from the Bitespeed backend task using modular JavaScript architecture.

## Stack

- Node.js (JavaScript)
- Express
- PostgreSQL (`pg`)

## Architecture

```text
dist/src/
  app.js
  server.js
  config/
    env.js
    database.js
  db/
    schema.js
    transaction.js
  middlewares/
    errorHandler.js
    notFound.js
  modules/
    identity/
      identity.controller.js
      identity.repository.js
      identity.routes.js
      identity.service.js
      identity.validation.js
  routes/
    index.js
  utils/
    AppError.js
    asyncHandler.js
```

## Setup

1. Create a PostgreSQL database once (if it does not already exist), for example `bitespeed`:

```bash
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE bitespeed;"
```
2. Copy `.env.example` to `.env` and update values.
3. Install dependencies:

```bash
npm install
```

4. Start the service:

```bash
npm start
```

Service runs by default at `http://localhost:3000`.

## Deploy On Render

Create a **Web Service** from this repository.

- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

Create a **PostgreSQL** service on Render and connect it to this app.

Set these environment variables in the Web Service:

- `NODE_ENV=production`
- `DATABASE_URL=<your render postgres url>`
- `PG_SSL=auto`

Notes:

- If you use Render Postgres **Internal Database URL**, SSL is usually not required.
- If you use Render Postgres **External Database URL**, SSL is usually required.
- `PG_SSL=auto` detects this from `DATABASE_URL` when it contains `sslmode=require`.

If deployment fails, check Render logs for one of these common causes:

- `DATABASE_URL is required.`: environment variable is missing.
- `no pg_hba.conf entry ... SSL off`: set `PG_SSL=true` or use URL with `sslmode=require`.
- `connect ECONNREFUSED`: wrong host/port in `DATABASE_URL` or DB not accessible.
- `password authentication failed`: invalid username/password in `DATABASE_URL`.

## Endpoints

### GET `/health`

Returns basic health status.

### POST `/identify`

Request body (at least one field required):

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

Response:

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

## Behavior implemented

- Creates a new primary contact when no match exists.
- Creates a secondary contact when incoming request has shared info plus new info.
- Merges multiple primary clusters by demoting newer primaries to secondary.
- Preserves oldest contact as canonical primary.
