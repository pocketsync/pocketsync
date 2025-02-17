# Build stage
FROM node:23.6.0-alpine AS builder

WORKDIR /app

# Assurez-vous que le chemin de COPY est correct
COPY pocketsync-backend/package.json pocketsync-backend/package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier tout le projet
COPY pocketsync-backend/. .

# Générer Prisma Client et builder l'application
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY pocketsync-backend/. .

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Générer Prisma Client
RUN npx prisma generate

# Copier l'application buildée
COPY --from=builder /app/dist ./dist

# Définir l'environnement
ENV NODE_ENV=production

# Exposer le port
EXPOSE 3000

# Démarrer le serveur
CMD ["npm", "run", "start:prod"]
