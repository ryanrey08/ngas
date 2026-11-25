# NGAS frontend on Docker

This folder documents the Docker setup for the eNGAS web frontend (Next.js 15 App Router, React 19,
TypeScript, Tailwind CSS 4, Redux Toolkit). The Docker files themselves live in the project root:

| File | Purpose |
| --- | --- |
| `Dockerfile` | Production image: 3-stage build (`deps` → `builder` → `runner`), Next.js standalone server, non-root |
| `Dockerfile.dev` | Development image: `next dev` with hot reload; only dependencies are baked in |
| `docker-compose.yml` | Shared base: the `frontend` service, backend URL, `host.docker.internal` mapping |
| `docker-compose.dev.yml` | Dev override: bind-mounted source, Docker-managed `node_modules`, polling file watcher |
| `docker-compose.prod.yml` | Prod override: build args, health check, read-only filesystem, restart policy, log rotation |
| `.dockerignore` | Keeps `node_modules`, `.next`, `.git`, and every real `.env*` file out of the build context |
| `.env.example` | All variables, including the Docker ones |

`next.config.ts` gained one line, `output: "standalone"`. Its redirects are unchanged.

## Prerequisites

- Docker Engine 24+ with Compose v2.20+ (macOS: Docker Desktop 4.x; Linux: `docker-ce` + `docker-compose-plugin`).
- The NGAS backend (Laravel API) running somewhere the frontend server can reach. Locally it is
  `make up` in the backend project, which publishes nginx on host port `8080`.

The images use `node:22-alpine` (Node 22 LTS). It satisfies the project's `engines` (`>=20.18`),
and Tailwind 4.3.3 builds fine on it; Node 20 reached end-of-life in April 2026. To build on another
Node line, pass `--build-arg NODE_VERSION=20` (or set it under `build.args` in the compose file).

## How the frontend talks to the backend

```
Browser ──► http(s)://<frontend>/api/backend/*  (same origin, httpOnly ngas_token cookie)
                     │  Next.js route handlers in src/app/api/backend (server side)
                     ▼
            NGAS_BACKEND_API_URL  ──►  Laravel API  /api/v1/engas/*  (Authorization: Bearer …)
```

The browser never calls the backend directly. It calls the frontend's own `/api/backend` proxy,
which adds the bearer token from the httpOnly cookie. That gives two kinds of URL:

| Variable | Who uses it | When it is read | Docker value |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Browser (axios) | **Build time** (inlined into JS) | `/api/backend` (relative, so it works on any domain) |
| `NEXT_PUBLIC_API_MODE` | Browser | **Build time** | `mock` or `real` |
| `NEXT_PUBLIC_API_TIMEOUT` | Browser | **Build time** | `15000` |
| `NGAS_BACKEND_API_URL` | Next.js server only | **Runtime** | must be reachable *from inside the container* |
| `NGAS_BACKEND_TIMEOUT_MS` | Next.js server only | Runtime | `15000` |

Key rules:

- **`localhost` inside a container is the container itself.** `http://localhost:8080` (the value in
  `.env.local` for `npm run dev`) does not reach the backend from Docker.
- The default `NGAS_BACKEND_API_URL` is `http://host.docker.internal:8080/api/v1/engas`: the backend
  published on the host's port 8080. Docker Desktop provides that name; on Linux the base Compose
  file maps it with `extra_hosts: host.docker.internal:host-gateway`.
- If the backend runs as containers on the same Docker host, you can instead attach the frontend to
  the backend's network and use its service name, e.g. `http://nginx:8080/api/v1/engas` (see
  "Same-host backend network" below).
- In a remote deployment, use the backend's real address, e.g. `https://api.example.gov.ph/api/v1/engas`.
- `NEXT_PUBLIC_*` values are compiled into the browser bundle by `next build`. Changing them on a
  running production container does nothing: **rebuild the image**. They are build args in
  `docker-compose.prod.yml`. In dev they are read when `next dev` starts, so a restart is enough.
- Never put secrets in `NEXT_PUBLIC_*` variables. There are no frontend secrets today; the bearer
  token only ever lives in the httpOnly cookie.
- Real `.env*` files are excluded by `.dockerignore`, so nothing from `.env.local` ends up in an image.

### Where values come from

Compose reads variables from your shell and from a file named `.env` next to the compose files
(not `.env.local`). Everything has a working default, so a `.env` is optional. To customise,
create a `.env` holding only the values you want to change, for example:

```bash
cat > .env <<'ENV'
NEXT_PUBLIC_API_MODE=real
FRONTEND_PORT=3001
ENV
```

Don't copy the whole `.env.example` to `.env`: its `NGAS_BACKEND_API_URL=http://localhost:8080/…`
is meant for `npm run dev` on the host and would point the container at itself. The "Docker" block
at the bottom of `.env.example` lists the extra variables. `.env` is gitignored by the existing
`.env*` rule.

## npm shortcuts

| Script | Runs |
| --- | --- |
| `npm run docker:dev` / `docker:dev:down` | dev `up --build` / `down` |
| `npm run docker:prod` | prod `up -d --build` |
| `npm run docker:prod:build` / `docker:prod:down` | prod `build` / `down` |
| `npm run docker:logs` / `docker:ps` | prod `logs -f` / `ps` |

## Development (macOS example)

```bash
cd ~/Desktop/ngas/ngas-frontend
# Backend running on the host (port 8080)? Then just:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
# open http://localhost:3000
```

- Source is bind-mounted at `/app`; edits on the host hot-reload in the browser (Fast Refresh).
- `node_modules` and `.next` live in Docker volumes (`ngas-frontend_node_modules`,
  `ngas-frontend_next_cache`), so the host's macOS `node_modules` never overwrites the Linux one.
- File watching uses polling (`WATCHPACK_POLLING=true`), which is reliable on macOS and Linux bind
  mounts at the cost of a little CPU.
- The image only rebuilds when `package.json` or `package-lock.json` change.

Stop it:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### After changing dependencies

The dependency volume would otherwise keep the old packages, so rebuild and renew it:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
docker volume rm ngas-frontend_node_modules
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

(`down -v` also works but removes the `.next` cache volume too.)

## Production

Build and start:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Rebuild and restart in one step (after a code or `NEXT_PUBLIC_*` change):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

What the production container does:

- Runs `node server.js` from `.next/standalone` as user `nextjs` (uid 1001). No npm, no dev
  dependencies, no source code; npm, npx, yarn and corepack are removed from the runtime image.
- App files are root-owned and the container root filesystem is read-only. Only
  `/app/.next/cache` and `/tmp` are writable (tmpfs).
- `no-new-privileges`, no privileged mode, only port 3000 exposed.
- Health check: `GET /login` must answer below 500, every 30s.
- `restart: unless-stopped`; logs go to stdout and are rotated by Docker (3 × 10 MB).
- `docker stop` sends SIGTERM to node (PID 1), which the Next.js server handles and exits.

Image name and tag come from `FRONTEND_IMAGE` / `FRONTEND_TAG` (default `ngas-frontend:latest`).
Tag releases, for example:

```bash
FRONTEND_TAG=1.0.0 docker compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### Linux server deployment example

```bash
# on the server, in a checkout of ngas-frontend
cat > .env <<'ENV'
NGAS_BACKEND_API_URL=https://api.example.gov.ph/api/v1/engas
NEXT_PUBLIC_API_MODE=mock
FRONTEND_BIND=127.0.0.1        # only the reverse proxy may reach the container
FRONTEND_PORT=3000
FRONTEND_TAG=1.0.0
ENV
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Put a TLS-terminating reverse proxy (nginx, Caddy, Traefik, a load balancer) in front and forward
`Host`, `X-Forwarded-Host` and `X-Forwarded-Proto`:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

These headers matter to the app: the login proxy rejects requests whose `Origin` does not match the
host (CSRF guard), and the auth cookie is marked `Secure` only when the request arrived over HTTPS.

To build once and ship the image instead of building on the server:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker tag ngas-frontend:latest registry.example.com/ngas-frontend:1.0.0
docker push registry.example.com/ngas-frontend:1.0.0
# on the server: FRONTEND_IMAGE=registry.example.com/ngas-frontend FRONTEND_TAG=1.0.0 docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build
```

Build on (or for) the server's CPU architecture, e.g. `docker buildx build --platform linux/amd64 …`
when building on Apple Silicon for an x86 server.

### Same-host backend network

If the backend's containers run on the same Docker host (its Compose project is `laravel-api`,
network `laravel-api_backend`), you can skip the host port and talk to its nginx service directly.
Create `docker-compose.backend-net.yml`:

```yaml
services:
  frontend:
    environment:
      NGAS_BACKEND_API_URL: http://nginx:8080/api/v1/engas
    networks: [default, backend]
networks:
  backend:
    external: true
    name: laravel-api_backend
```

and add `-f docker-compose.backend-net.yml` to your commands. The backend must already be up.

## Automatic deploys (GitHub Actions)

NGAS runs on `mpc-front-end` next to the other frontends: a 1 vCPU / 2 GB
server, so nothing is built there. `.github/workflows/deploy.yml`:

1. **check** (every pull request and push to `main`): `npm ci`, type check, lint.
2. **image** (`main` only, after check): builds the production image in
   GitHub Actions and pushes it to `ghcr.io/ryanrey08/ngas:sha-<commit>`.
   Layers are cached, so dependencies are reinstalled only when
   `package-lock.json` changes. `NEXT_PUBLIC_*` values come from repository
   variables (Settings → Secrets and variables → Actions → **Variables**);
   unset ones use the `docker-compose.prod.yml` defaults.
3. **deploy**: connects over SSH and sends `deploy <commit>` plus a
   short-lived, read-only registry token. Nothing else is sent.

On the server the Actions key is pinned to [`deploy.sh`](deploy.sh), installed
as `/usr/local/sbin/ngas-deploy`. It pulls the image, checks out the same
commit (compose files), starts it and waits for the `/login` health check. If
the new release is unhealthy, it starts the previous one again and fails the
job. It records every attempt in `/var/lib/ngas/releases` and keeps the images
of the last five releases, so rollbacks work without GitHub.

The container is capped at 384 MB (`FRONTEND_MEM_LIMIT`) with Node's heap at
256 MB, so one busy app cannot starve the others on the server.

### Rolling back

GitHub: **Actions → Rollback → Run workflow**. Leave `target_sha` empty to go
back one release (run it again to go back further), or give an earlier
released commit, and enter a `reason`. Run it first with `confirm` empty: it
only shows the live release and the target. Then run it again with `confirm`
set to `ROLLBACK`. A rollback lasts until the next deploy from `main`.

On the server, as root: `ngas-deploy releases`, then `ngas-deploy rollback`.

### Server layout

| | |
|---|---|
| Checkout | `/root/ngas` (on `main`; deploys check out the released commit) |
| Settings | `/root/ngas/.env.docker`: `FRONTEND_BIND=127.0.0.1`, `FRONTEND_PORT=3101`, `NGAS_BACKEND_API_URL` |
| Public address | Caddy (`/etc/caddy/Caddyfile`) serves port 3001 → `127.0.0.1:3101`. With a domain, replace `:3001` with the domain name |

### Repository secrets

Settings → Secrets and variables → Actions → **Repository secrets** (on a
personal repository only the owner can add them):

| Secret | Value |
| --- | --- |
| `SERVER_HOST` | The server's IP or host name. |
| `SERVER_SSH_KEY` | The private half of the `github-actions-deploy-ngas` key, including the `BEGIN`/`END` lines. Its public half is pinned on the server. |
| `DEPLOY_KNOWN_HOSTS` | The server's host key lines (`<server ip> <type> <key>`), read on the server from `/etc/ssh/ssh_host_*_key.pub`. |

## Managing containers

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps        # status + health
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f   # follow logs
docker inspect --format '{{json .State.Health}}' ngas-frontend-frontend-1 # health check history
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker image ls ngas-frontend                                             # image sizes
```

Use the same `-f` pair for dev (`docker-compose.dev.yml`). Running both dev and prod at once needs a
different `FRONTEND_PORT` and project name (`-p ngas-frontend-dev`).

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Login says "The eNGAS service is currently unavailable" | The server cannot reach `NGAS_BACKEND_API_URL`. Check the backend is up (`curl http://localhost:8080/api/v1/engas/auth/me` should return 401), and that the URL is not `localhost`. Test from inside: `docker compose … exec frontend node -e "fetch(process.env.NGAS_BACKEND_API_URL+'/auth/me').then(r=>console.log(r.status))"` |
| Login returns 403 "Cross-origin request rejected" | A reverse proxy is rewriting `Host` without forwarding `X-Forwarded-Host`. Forward the headers shown above. |
| Logged in, but the session is lost on every request over plain HTTP | The browser drops `Secure` cookies on HTTP. Make sure the proxy sends `X-Forwarded-Proto: https` only when the site really is HTTPS. |
| Changed `NEXT_PUBLIC_API_MODE` but nothing changed | Build-time variable: rebuild with `up -d --build`. In dev, restart the container. |
| Hot reload does not pick up changes | Check `WATCHPACK_POLLING` is `true` in `docker compose … config`; make sure you edit files under the project folder that is mounted. |
| `Module not found` after adding a package | The dependency volume is stale: see "After changing dependencies". |
| `EACCES` writing `.next` in dev | The `next_cache` volume was created by another user/image. `docker volume rm ngas-frontend_next_cache` and start again. |
| Port 3000 already in use | Stop the local `npm run dev`, or set `FRONTEND_PORT=3001`. |
| Build fails fetching Google Fonts | `next/font/google` downloads Inter and Montserrat at build time; the build needs internet access. |
| Container is `unhealthy` | `docker inspect --format '{{json .State.Health}}' <container>` shows the last checks; `logs` shows server errors. |
