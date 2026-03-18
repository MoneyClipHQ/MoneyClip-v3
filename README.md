# MoneyClip

This document provides instructions for setting up and deploying the MoneyClip application using Docker on a Google Cloud Platform (GCP) Virtual Machine.

## Containerization with Docker

The project includes a `Dockerfile` to build a container image for the application. This ensures a consistent environment for development, testing, and production.

### Dockerfile Overview

The `Dockerfile` is a multi-stage build that performs the following steps:

1.  **Builder Stage**: An application is built on a `node:18-alpine` image. It installs dependencies, and builds the application.

2.  **Production Stage**: The final image is also based on `node:18-alpine`. It copies the built application and only the necessary production dependencies from the builder stage, resulting in a smaller, more secure image.

### Building the Docker Image

To build the Docker image, run the following command in the root of the project:

```sh
docker build -t moneyclip .
```

## Deployment on GCP VM

These steps outline how to deploy the containerized application to a GCP VM.

### 1. Push the Docker Image to Google Container Registry (GCR)

First, tag the image with the GCR host and your project ID, then push it.

```sh
# Tag the image
docker tag moneyclip gcr.io/[GCP_PROJECT_ID]/moneyclip:v1

# Push the image to GCR
docker push gcr.io/[GCP_PROJECT_ID]/moneyclip:v1
```

Replace `[GCP_PROJECT_ID]` with your Google Cloud project ID.

### 2. Set Up a GCP VM Instance

Create a new VM instance in the GCP Console. Choose an appropriate machine type and ensure that Docker is installed. You can use a startup script to install Docker on a new instance.

### 3. Pull and Run the Docker Image on the VM

SSH into your VM and pull the image from GCR. Then, run the container, making sure to pass the necessary environment variables and map the ports.

```sh
# Pull the image from GCR
docker pull gcr.io/[GCP_PROJECT_ID]/moneyclip:v1

# Run the container
docker run -d -p 80:8080 \
  --name moneyclip-app \
  -e DATABASE_URL="your_database_url" \
  -e SESSION_SECRET="your_session_secret" \
  -e STRIPE_SECRET_KEY="your_stripe_secret_key" \
  -e STRIPE_PRICE_ID_BASIC="your_stripe_price_id" \
  gcr.io/[GCP_PROJECT_ID]/moneyclip:v1
```

*   `-d`: Run the container in detached mode.
*   `-p 80:8080`: Map port 80 on the host to port 8080 in the container.
*   `--name moneyclip-app`: Assign a name to the container.
*   `-e`: Set environment variables. You must provide all the required variables from your `.env` file.

### 4. Configure Firewall Rules

In the GCP Console, navigate to the firewall rules for your VPC network and create a new rule to allow traffic on port 80 (HTTP) and 443 (HTTPS) to your VM.

### 5. Map Domain to VM IP Address

Go to your domain registrar's DNS settings and create an `A` record that points `dev.usemoneyclip.com` to the external IP address of your GCP VM.

### 6. Secure the Deployment with SSL/TLS

For a production environment, it is crucial to secure your application with an SSL/TLS certificate. You can use a reverse proxy like Nginx or Caddy to handle HTTPS and manage certificates from Let's Encrypt.
