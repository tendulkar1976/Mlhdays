# Dockerfile for AI Tax Copilot Backend
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies required for Prisma and native tools
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code and Prisma configuration
COPY tsconfig.json ./
COPY next.config.mjs ./
COPY prisma ./prisma/
COPY src ./src/

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=development

CMD ["npm", "run", "dev"]
