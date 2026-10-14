# Practical 11 - Frontend image (React + Vite, multi-stage build)

# ---------- Stage 1: build the production bundle ----------
FROM node:22 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Stage 2: serve the static build (small final image) ----------
FROM node:22-alpine
WORKDIR /app

RUN npm install -g serve@14

COPY --from=build /app/dist ./dist

# Document the port the preview server listens on.
EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
