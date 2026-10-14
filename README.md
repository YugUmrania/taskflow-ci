# TaskFlow — Task Management App

A full-stack task management application built for the **Advanced Web Development Frameworks (AWDF)** practicals. It pairs a **React + Vite** single-page frontend with an **Express + Mongoose** REST API, and ships with **Docker Compose** for a one-command local stack.

## Tech Stack

| Layer     | Technology                                                |
| --------- | --------------------------------------------------------- |
| Frontend  | React 18, Vite 5, plain CSS                               |
| Backend   | Node.js 22, Express 4, Mongoose 9                         |
| Database  | MongoDB 7                                                 |
| AI        | OpenAI SDK against any OpenAI-compatible provider (free)  |
| Container | Docker, Docker Compose                                    |
| CI        | GitHub Actions (Jest + Supertest)                         |

## Project Structure

```
.
├── .github/workflows/ci.yml      # CI pipeline (Practical 12)
├── docker-compose.yml            # Frontend + backend + MongoDB stack
├── task-management-backend/      # Express REST API
│   ├── app.js                    # Express app (middleware, routes)
│   ├── server.js                 # HTTP server entry point
│   ├── config.js                 # Environment configuration
│   ├── events.js                 # Application EventEmitter (Practical 10)
│   ├── listeners.js              # Event listeners / notifications (Practical 10)
│   ├── middleware/               # logger, cache, error handler
│   ├── models/Task.js            # Mongoose Task model
│   ├── routes/tasks.js           # CRUD routes
│   ├── routes/ai.js              # AI description endpoint (Practical 13)
│   └── test/tasks.test.js        # Jest + Supertest suite (Practical 12)
└── task-management-frontend/     # React + Vite UI
    ├── src/App.jsx               # Root component
    ├── src/api.js                # API client
    └── src/components/           # TaskForm, TaskCard, ActivityLog
```

## Prerequisites

- [Node.js 22+](https://nodejs.org/) (Mongoose 9 requires Node ≥ 20.19)
- Either [Docker Desktop](https://www.docker.com/products/docker-desktop/) **or** a local MongoDB 7 instance

## Quick Start (Docker Compose)

```bash
# 1. Create the backend environment file from the template
cd task-management-backend
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
# then open .env and paste your OPENAI_API_KEY (optional - see below)

# 2. Build and start the whole stack
cd ..
docker compose up --build
```

| Service  | URL                     |
| -------- | ----------------------- |
| Frontend | http://localhost:5173   |
| Backend  | http://localhost:3000   |

> The backend `env_file` is optional. Without a valid key the AI feature falls back to a locally generated description, so the app still works end to end.

## Running Locally (without Docker)

```bash
# Terminal 1 - backend
cd task-management-backend
npm install
npm run dev            # http://localhost:3000  (needs MongoDB on 27017)

# Terminal 2 - frontend
cd task-management-frontend
npm install
npm run dev            # http://localhost:5173
```

## Environment Variables

`task-management-backend/.env` (never committed):

| Variable          | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `MONGO_URI`       | MongoDB connection string                                  |
| `PORT`            | Backend port (default `3000`)                              |
| `OPENAI_API_KEY`  | API key for the AI description feature                     |
| `OPENAI_BASE_URL` | Base URL of an OpenAI-compatible provider (optional)       |
| `OPENAI_MODEL`    | Model name (optional)                                      |

Because the OpenAI SDK also reads `OPENAI_BASE_URL`, any OpenAI-compatible provider works without code changes. The template defaults to a free option:

- **Google Gemini** — https://aistudio.google.com/apikey
- **Groq** — https://console.groq.com/keys

## API Endpoints

| Method   | Endpoint                        | Description                       |
| -------- | ------------------------------- | --------------------------------- |
| `GET`    | `/health`                       | Health check                      |
| `GET`    | `/api/tasks`                    | List tasks                        |
| `POST`   | `/api/tasks`                    | Create a task                     |
| `GET`    | `/api/tasks/:id`                | Get a single task                 |
| `PUT`    | `/api/tasks/:id`                | Update a task                     |
| `DELETE` | `/api/tasks/:id`                | Delete a task                     |
| `POST`   | `/api/ai/generate-description`  | Generate a task description (AI)  |

## Features by Practical

- **Practical 10 — Event-driven architecture:** a native `EventEmitter` decouples task events from side effects (notifications / activity log).
- **Practical 11 — Containerization:** multi-stage Docker images and a Compose stack (frontend, backend, MongoDB) with a persistent named volume.
- **Practical 12 — Testing & CI:** Jest + Supertest suite with mocked model/events, executed by a GitHub Actions workflow.
- **Practical 13 — AI integration:** an AI-assisted description generator with a server-side key, lazy SDK loading, a fallback path, and per-title rate limiting.

## Tests

```bash
cd task-management-backend
npm test
```

The suite runs without a database (the Mongoose model and event bus are mocked) and is also executed automatically by GitHub Actions on every push and pull request to `main`.

## License

Released for academic use as part of the AWDF coursework.
