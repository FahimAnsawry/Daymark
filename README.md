# Laravel + React Fullstack Application

A modern fullstack application architecture combining **Laravel 11+ (API & Sanctum)** and **React 19 + TypeScript (Vite, TanStack Router, TanStack Query, Tailwind CSS v4, PostgreSQL)**.

---

## 🚀 Tech Stack Overview

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Backend API** | [Laravel 13](https://laravel.com) | RESTful API, Laravel Sanctum token & SPA cookie authentication |
| **Database** | [PostgreSQL](https://www.postgresql.org) | Configured via `pgsql` driver in `backend/.env` |
| **Frontend UI** | [React 19](https://react.dev) + TypeScript | Fast Vite SPA with strict typing and modern React architecture |
| **Routing** | [TanStack Router v1](https://tanstack.com/router) | Fully type-safe routing with automatic file-based route generation and code splitting |
| **State Management** | [TanStack Query v5](https://tanstack.com/query) | Asynchronous server state caching, background refetching, and optimistic mutations |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Zero-runtime CSS framework via `@tailwindcss/vite` |

---

## 📁 Project Structure

```
laravel_react/
├── backend/                  # Laravel API application
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   │   ├── AuthController.php        # Register, Login, Logout, Me endpoints
│   │   │   ├── HealthController.php      # Health & PostgreSQL diagnostic endpoint
│   │   │   └── DemoTaskController.php    # Demo CRUD API for TanStack Query
│   │   └── Models/User.php               # User model with HasApiTokens
│   ├── config/
│   │   ├── cors.php                      # Configured for frontend origin & credentials
│   │   └── sanctum.php                   # Sanctum authentication configuration
│   ├── routes/
│   │   └── api.php                       # Registered API endpoints
│   └── .env                              # Backend environment configuration (PostgreSQL)
│
├── frontend/                 # React SPA application (Vite)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts                    # Preconfigured Axios client with /api proxy
│   │   │   └── query-client.ts           # TanStack QueryClient with caching defaults
│   │   ├── routes/
│   │   │   ├── __root.tsx                # Root layout, navigation bar, devtools
│   │   │   ├── index.tsx                 # Overview and tech stack showcase
│   │   │   ├── tasks.tsx                 # TanStack Query live queries & mutations demo
│   │   │   └── health.tsx                # Live API & PostgreSQL diagnostics
│   │   ├── routeTree.gen.ts              # Auto-generated TanStack Router route tree
│   │   ├── main.tsx                      # App entrypoint (RouterProvider & QueryClientProvider)
│   │   └── index.css                     # Tailwind CSS v4 entrypoint
│   ├── vite.config.ts                    # Vite config with TanStack Router plugin & API proxy
│   └── package.json                      # Frontend dependencies and scripts
│
├── package.json              # Monorepo root helper scripts
└── README.md
```

---

## 🛠️ Quick Start

### 1. Configure PostgreSQL Database

1. Make sure your PostgreSQL server is running (default port: `5432`).
2. Open [`backend/.env`](file:///F:/laravel_react/backend/.env) and set your PostgreSQL password:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=laravel_react
   DB_USERNAME=postgres
   DB_PASSWORD=your_postgres_password
   ```
3. Create the database in PostgreSQL if it doesn't already exist:
   ```bash
   psql -U postgres -c "CREATE DATABASE laravel_react;"
   ```
4. Run the database migrations:
   ```bash
   cd backend
   php artisan migrate
   ```

---

### 2. Start the Development Servers

Open two terminal windows:

#### Terminal 1 — Backend (Laravel API)
```bash
cd backend
php artisan serve
```
> Server runs on: `http://127.0.0.1:8000`

#### Terminal 2 — Frontend (Vite + React)
```bash
cd frontend
npm run dev
```
> Application runs on: `http://localhost:5173`

*(The Vite development server is configured to automatically proxy all `/api` requests to `http://127.0.0.1:8000`, eliminating CORS hurdles during local development).*

---

## 📡 Included API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health & PostgreSQL connection status | No |
| `POST` | `/api/auth/register` | Register a new user & receive API token | No |
| `POST` | `/api/auth/login` | Authenticate user & receive API token | No |
| `POST` | `/api/auth/logout` | Revoke active access token | Yes (Sanctum) |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes (Sanctum) |
| `GET` | `/api/tasks` | Fetch demo tasks (used by TanStack Query) | No |
| `POST` | `/api/tasks` | Create a new task (TanStack Query mutation) | No |
| `PATCH`| `/api/tasks/{id}/toggle` | Toggle task completion | No |
| `DELETE`| `/api/tasks/{id}` | Delete task | No |

---

## 🧭 TanStack Router & File-Based Routing

Routes are defined under `frontend/src/routes/`:
- Adding any new file like `frontend/src/routes/profile.tsx` will automatically update `frontend/src/routeTree.gen.ts` in real time.
- Fully type-safe links: `<Link to="/tasks" />` provides autocomplete and compile-time route verification.
- Both the **TanStack Router Devtools** and **React Query Devtools** are embedded and accessible in the bottom corners in development mode.
