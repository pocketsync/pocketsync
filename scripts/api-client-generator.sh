#!/bin/bash

# Exit on error
set -e

# Read configuration
CONFIG_FILE="$(dirname "$0")/api-client-generator-config.yaml"
BACKEND_DIR="$(dirname "$0")/../deltasync-backend"
CLIENT_DIR="$(dirname "$0")/../deltasync-web/api-client"

# Function to check if backend is running
check_backend() {
    curl -s http://localhost:3000/api-json > /dev/null
    return $?
}

# Function to wait for backend to be ready with a timeout (30 seconds)
wait_for_backend() {
    echo "Waiting for backend to be ready (timeout: 30s)..."
    local max_retries=30
    local retries=0

    until check_backend; do
        retries=$((retries + 1))
        if [ "$retries" -ge "$max_retries" ]; then
            echo "Backend did not start within the timeout period."
            return 1
        fi
        sleep 1
    done
    echo "Backend is ready!"
}

# Check if backend is already running
BACKEND_STARTED=false
if ! check_backend; then
    echo "Starting backend server..."
    cd "$BACKEND_DIR"
    npm run start:dev & 
    BACKEND_PID=$!
    BACKEND_STARTED=true
    wait_for_backend || { echo "Failed to start backend."; kill $BACKEND_PID; exit 1; }
    cd - > /dev/null
fi

# Clean up existing client code
echo "Cleaning up existing client code..."
if [ -d "$CLIENT_DIR" ]; then
    rm -rf "$CLIENT_DIR"
fi

# Generate Web Console Client
echo "Generating Web Console API Client..."
openapi-generator-cli generate -g typescript-axios -c "$CONFIG_FILE" -i "http://localhost:3000/api-json" -o "$CLIENT_DIR"

# Shutdown backend if we started it
if [ "$BACKEND_STARTED" = true ]; then
    echo "Shutting down backend server..."
    kill -SIGTERM $BACKEND_PID
    wait $BACKEND_PID 2>/dev/null || true
fi

echo "API client generation completed successfully!"
