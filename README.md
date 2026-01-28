# Navigation Page

[中文说明](./README.zh-CN.md)

A secure, private, self-hosted navigation page system designed for personal use.

A full-stack navigation/portal page that supports login, navigation management, and card editing. It uses a single Node.js process to serve both the frontend build (`dist/`) and the API (`/api`).

## Features

- Secure authentication: JWT-based auth with access token (in-memory) and refresh token (HttpOnly cookie).
- Private access: only authenticated users can access navigation content.
- Persistent sessions: refresh tokens are valid for 90 days and can be silently renewed.
- Categorized navigation: organize links by categories (dev, tools, etc.).
- Search: real-time filtering of navigation links.
- Dark mode: switch between light and dark themes.
- Responsive design: optimized for desktop and mobile devices.
- JSON storage: simple, portable flat-file storage without an external database.

## Screenshots

| Login | Home |
| --- | --- |
| ![Login](docs/ScreenShot_2026-01-29_070644_659.png) | ![Home](docs/ScreenShot_2026-01-29_070706_698.png) |

| Manage navigation | Edit card |
| --- | --- |
| ![Manage](docs/ScreenShot_2026-01-29_070730_618.png) | ![Edit](docs/ScreenShot_2026-01-29_070807_448.png) |

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Auth: JWT access/refresh tokens
- Storage: JSON files in `api/data/`

## Quick Start (Local Dev)

```bash
npm install
```

Create your `.env`:

```bash
cp .env.example .env
```

Run in dev mode (frontend + API):

```bash
npm run dev
```

## Build & Run (Single Process)

```bash
npm install
npm run build
npm start
```

Default port is `PORT` in `.env` (default: 3000).

## Data & Admin

- Default admin in `.env`:
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
- Data files:
  - `api/data/users.json`
  - `api/data/navigations.json`

Admin is only initialized when `users.json` has no admin record; changing `.env` won’t overwrite an existing admin password automatically.

## Health Check

- `GET /api/health` → `{"success":true,"message":"ok"}`
