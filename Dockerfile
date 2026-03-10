# Stage 1: Build the application
FROM node:20 AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the client and server
RUN npm run build

# Stage 2: Production image
FROM node:20-slim
WORKDIR /app

# Copy production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
RUN npm prune --production

# Copy the built client and server from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./client/dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the server
CMD ["node", "dist/index.prod.js"]
