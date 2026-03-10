# Migration Plan

This document outlines the plan for migrating the MoneyClip application from Replit to Google Cloud Run.

## Summary of Changes

The following files will be modified:

*   `Dockerfile` (new file)
*   `.dockerignore` (new file)
*   `package.json`
*   `vite.config.ts`
*   `client/index.html`
*   `server/objectStorage.ts`

## Detailed Plan

### 1. Containerization

A `Dockerfile` and a `.dockerignore` file will be created to containerize the application.

#### `Dockerfile`

```dockerfile
# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the client
RUN npm run build

# Make port 5000 available to the world outside this container
EXPOSE 5000

# Define environment variable
ENV PORT 5000

# Run the app when the container launches
CMD ["npm", "run", "start"]
```

#### `.dockerignore`

```
node_modules
.git
.gitignore
.replit
.clinerules
Dockerfile
.dockerignore
dist
```

### 2. Dependency Removal

Replit-specific dependencies will be removed from the project.

#### `package.json`

The following `devDependencies` will be removed:

*   `@replit/vite-plugin-cartographer`
*   `@replit/vite-plugin-runtime-error-modal`

#### `vite.config.ts`

The following lines will be removed:

*   `import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";`
*   The `runtimeErrorOverlay()` plugin.
*   The conditional import and usage of `@replit/vite-plugin-cartographer`.

### 3. Code Cleanup

Replit-specific code will be removed.

#### `client/index.html`

The following script tag will be removed:

*   `<script type="text/javascript" src="https://replit.com/public/js/replit-dev-banner.js"></script>`

### 4. Object Storage Refactoring

The `server/objectStorage.ts` file will be refactored to remove Replit dependencies and use standard Google Cloud Storage authentication and URL signing.

*   The `REPLIT_SIDECAR_ENDPOINT` constant will be removed.
*   The `objectStorageClient` will be instantiated without arguments to use default credentials.
*   The `signObjectURL` function will be rewritten to use the `getSignedUrl` method from the `@google-cloud/storage` library.
