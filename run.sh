#!/bin/bash

# PaperVault - Run both backend and frontend apps

# Configuration
REPO_PATH="${PAPERVAULT_PATH:-$(pwd)}"  # Default to current dir, override with env var
CONFIG_FILE="$HOME/.config/paper-vault/pv.config.json"
BACKEND_DIR="$REPO_PATH/pv_back"
FRONTEND_DIR="$REPO_PATH/pv_front"
HEALTH_CHECK_URL="http://localhost:${BACKEND_PORT:-3000}/api/healthcheck"
HEALTH_CHECK_MAX_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=1  # seconds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[PAPERVAULT]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PAPERVAULT]${NC} $1"
}

print_error() {
    echo -e "${RED}[PAPERVAULT]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[PAPERVAULT]${NC} $1"
}

# Function to load config file and export as environment variables
load_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "Config file not found at $CONFIG_FILE"
        print_error "Please create a JSON file with your configuration"
        exit 1
    fi

    print_status "Loading configuration from $CONFIG_FILE"
    
    # Parse JSON and export variables
    while IFS="=" read -r key value; do
        # Remove quotes and export
        key=$(echo "$key" | tr -d '"')
        value=$(echo "$value" | tr -d '"' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -n "$key" ] && [ -n "$value" ]; then
            export "$key=$value"
            print_status "  Set $key=$value"
        fi
    done < <(jq -r 'to_entries[] | "\(.key)=\(.value)"' "$CONFIG_FILE")

    # Special env variables for the frontend
    export "VITE_BACKEND_BASE_URL=http://localhost:${BACKEND_PORT}/api"
}

# Function to check if backend is healthy
check_backend_health() {
    local url=$1
    local max_attempts=$2
    local interval=$3
    local attempt=1

    print_status "Waiting for backend to be ready at $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "Backend is healthy (attempt $attempt)"
            return 0
        fi
        print_status "  Attempt $attempt/$max_attempts - backend not ready yet..."
        sleep $interval
        attempt=$((attempt + 1))
    done
    
    print_error "Backend failed to become healthy after $max_attempts attempts"
    return 1
}

start_backend() {
    print_status "Starting backend from $BACKEND_DIR..."
    cd "$BACKEND_DIR"

    # Always run npm install
    print_status "Running npm install..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "npm install failed"
        exit 1
    fi
    print_success "npm install completed"
    
    # Run compile
    print_status "Compiling TypeScript..."
    npm run compile
    if [ $? -ne 0 ]; then
        print_error "Compilation failed"
        exit 1
    fi
    print_success "Compilation completed"
    
    # Check if dist/server.js exists
    if [ ! -f "dist/src/server.js" ]; then
        print_error "dist/server.js not found after compilation"
        exit 1
    fi
    
    # Start backend with node
    print_status "Starting backend server..."
    node dist/src/server.js > /tmp/pv_backend.log 2>&1 &
    BACKEND_PID=$!
    print_success "Backend started with PID: $BACKEND_PID" 

    # Wait for backend to be healthy
    if ! check_backend_health "$HEALTH_CHECK_URL" "$HEALTH_CHECK_MAX_ATTEMPTS" "$HEALTH_CHECK_INTERVAL"; then
        print_error "Backend failed to start. Check logs at /tmp/pv_backend.log"
        exit 1
    fi
}

start_frontend() {
    print_status "Starting frontend from $FRONTEND_DIR..."
    cd "$FRONTEND_DIR"
    
    # Always run npm install
    print_status "Running npm install..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "npm install failed"
        exit 1
    fi
    print_success "npm install completed"
    
    # Start frontend (in foreground, but we'll manage it)
    npm run dev -- --port ${FRONTEND_PORT} > /tmp/pv_frontend.log 2>&1 &
    FRONTEND_PID=$!
    print_success "Frontend started with PID: $FRONTEND_PID"
}

# Function to open URL in default browser (cross-platform)
open_frontend_url() {
    local url=$1
    
    # Detect OS and use appropriate command
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "$url"
        else
            print_warning "Could not open browser automatically. Please visit: $url"
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash, Cygwin)
        start "$url"
    else
        print_warning "Unsupported OS. Please open browser manually at: $url"
    fi
}

# Function to cleanup processes on exit
cleanup() {
    print_status "Shutting down PaperVault..."
    
    if [ -n "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        print_status "Stopping backend (PID: $BACKEND_PID)"
        kill $BACKEND_PID 2>/dev/null
        wait $BACKEND_PID 2>/dev/null
    fi
    
    if [ -n "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        print_status "Stopping frontend (PID: $FRONTEND_PID)"
        kill $FRONTEND_PID 2>/dev/null
        wait $FRONTEND_PID 2>/dev/null
    fi
    
    print_success "Shutdown complete"
    exit 0
}

# Set up trap for cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Main execution
main() {
    print_status "Starting PaperVault..."
    
    # Check if jq is installed (needed for JSON parsing)
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install it first:"
        print_error "  Ubuntu/Debian: sudo apt-get install jq"
        print_error "  macOS: brew install jq"
        print_error "  Fedora: sudo dnf install jq"
        print_error "  Arch: sudo pacman -Sy jq"
        exit 1
    fi
    
    # Load configuration
    load_config
    
    # Validate required directories
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found at $BACKEND_DIR"
        print_error "Please run this script from the PaperVault repository root"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found at $FRONTEND_DIR"
        print_error "Please run this script from the PaperVault repository root"
        exit 1
    fi
    
    print_status "Using backend port: $BACKEND_PORT"
    print_status "Using frontend port: $FRONTEND_PORT"
    
    # Update health check URL with actual port
    HEALTH_CHECK_URL="http://localhost:${BACKEND_PORT}/api/healthcheck"
    
    # Start backend
    start_backend

    # Start frontend
    start_frontend
    
    # Open frontend in default browser
    print_status "Opening frontend in default browser..."
    sleep 2  # Give frontend a moment to start
    open_frontend_url "http://localhost:${FRONTEND_PORT}"

    # Print success message and URLs
    print_success "PaperVault is running!"
    echo ""
    echo "  Backend:  http://localhost:${BACKEND_PORT}"
    echo "  Frontend: http://localhost:${FRONTEND_PORT}"
    echo "  Backend logs:  tail -f /tmp/pv_backend.log"
    echo "  Frontend logs: tail -f /tmp/pv_frontend.log"
    echo ""
    print_status "Press Ctrl+C to stop both applications"
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
}

# Run main function
main
