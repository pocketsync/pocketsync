# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and generate Prisma client
COPY . .
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy entire project
COPY . .

# Install production dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production

# Expose port and start server
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
