# Stage 1: Build the application
# Use a specific Node.js version for reproducibility
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
# This command should bundle the client and server for production
RUN npm run build

# Stage 2: Production image
# Use a lightweight Node.js image for the final container
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy only production dependencies from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# It's good practice to run `npm prune --production` to ensure only production dependencies are installed.
# However, since we are copying from a builder stage that already has all dependencies,
# we will rely on the `package.json` for the correct dependencies.
# A cleaner approach would be to copy the package.json first, run `npm install --production`,
# and then copy the built artifacts. But for simplicity, this works.

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port the app runs on
EXPOSE 8080

# The command to start the application
CMD ["node", "dist/index.prod.js"]
