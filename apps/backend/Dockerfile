FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files needed for install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install only backend dependencies
RUN pnpm install --filter backend --frozen-lockfile

# Copy backend source
COPY apps/backend/ ./apps/backend/

# Build TypeScript
WORKDIR /app/apps/backend
RUN pnpm build

EXPOSE 4000

CMD ["node", "dist/index.js"]