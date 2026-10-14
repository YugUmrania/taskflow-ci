# Practical 11 - Backend image (Node / Express)
FROM node:22

WORKDIR /app

# Install dependencies first so this layer is cached when only code changes.
COPY package*.json ./
RUN npm install

# Copy the rest of the backend source.
COPY . .

# Document the port the app listens on (actual mapping is in docker-compose.yml).
EXPOSE 3000

CMD ["node", "server.js"]
