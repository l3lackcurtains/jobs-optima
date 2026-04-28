#!/bin/bash

# Development Environment Cleanup Script
# This script helps clean up and stop development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to kill process on port
kill_port() {
    local port=$1
    print_status "Checking port $port..."
    
    # Find process using the port
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ ! -z "$pid" ]; then
        print_warning "Found process $pid using port $port"
        kill -9 $pid 2>/dev/null || true
        print_success "Killed process on port $port"
    else
        print_status "Port $port is free"
    fi
}

# Function to stop Docker services
stop_docker() {
    print_status "Stopping Docker services..."
    docker compose down 2>/dev/null || true
    docker compose -f docker-compose.yml down 2>/dev/null || true
    
    # Also stop any running containers with resume-builder name
    print_status "Stopping any remaining containers..."
    docker ps | grep "resume-builder" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
    
    print_success "Docker services stopped"
}

# Function to clean Docker resources
clean_docker() {
    print_status "Cleaning Docker resources..."
    
    # Stop all containers for this project
    docker ps -a | grep "resume-builder" | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true
    docker ps -a | grep "resume-builder" | awk '{print $1}' | xargs -r docker rm 2>/dev/null || true
    
    # Remove project images
    docker images | grep "resume-builder" | awk '{print $3}' | xargs -r docker rmi 2>/dev/null || true
    
    # Remove project volumes
    docker volume ls | grep "resume-builder" | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null || true
    
    print_success "Docker resources cleaned"
}

# Function to clean Node.js artifacts
clean_node() {
    print_status "Cleaning Node.js artifacts..."
    
    # Clean node_modules
    if [ "$1" == "full" ]; then
        print_warning "Removing all node_modules (this will require reinstallation)..."
        find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
        print_success "Removed all node_modules directories"
    fi
    
    # Clean build artifacts
    print_status "Cleaning build artifacts..."
    rm -rf apps/web/.next 2>/dev/null || true
    rm -rf apps/web/.turbo 2>/dev/null || true
    rm -rf apps/api/dist 2>/dev/null || true
    rm -rf apps/extension/dist 2>/dev/null || true
    rm -rf .nx 2>/dev/null || true
    rm -rf dist 2>/dev/null || true
    rm -rf .turbo 2>/dev/null || true
    
    print_success "Build artifacts cleaned"
}

# Function to clean logs
clean_logs() {
    print_status "Cleaning log files..."
    find . -name "*.log" -type f -delete 2>/dev/null || true
    rm -rf logs 2>/dev/null || true
    print_success "Log files cleaned"
}


# Main menu
show_menu() {
    echo ""
    echo "================================"
    echo "   Development Cleanup Script"
    echo "================================"
    echo "1) Quick cleanup (kill ports + stop Docker)"
    echo "2) Full cleanup (kill ports + stop Docker + clean builds/dist/node_modules)"
    echo "3) Kill all ports (4000, 8888)"
    echo "4) Stop Docker services"
    echo "5) Clean build artifacts only"
    echo "q) Quit"
    echo ""
    echo -n "Select option: "
}

# Process command line arguments
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  --quick          Quick cleanup (kill ports + stop Docker)"
    echo "  --full           Full cleanup (kill ports + stop Docker + clean builds/dist/node_modules)"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "Without arguments, shows interactive menu"
    exit 0
fi

# Handle command line arguments
case "$1" in
    --quick)
        kill_port 4000
        kill_port 8888
        stop_docker
        print_success "Quick cleanup complete!"
        exit 0
        ;;
    --full)
        kill_port 4000
        kill_port 8888
        stop_docker
        clean_docker
        clean_node "full"
        clean_logs
        print_success "Full cleanup complete! Run 'npm install' or 'bun install' to reinstall dependencies."
        exit 0
        ;;
    "")
        # Show interactive menu
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

# Interactive menu loop
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1)
            kill_port 4000
            kill_port 8888
            stop_docker
            print_success "Quick cleanup complete!"
            ;;
        2)
            kill_port 4000
            kill_port 8888
            stop_docker
            clean_docker
            clean_node "full"
            clean_logs
            print_success "Full cleanup complete! Run 'npm install' or 'bun install' to reinstall dependencies."
            ;;
        3)
            kill_port 4000
            kill_port 8888
            ;;
        4)
            stop_docker
            ;;
        5)
            clean_node
            clean_logs
            ;;
        q|Q)
            print_status "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option. Please try again."
            ;;
    esac
done