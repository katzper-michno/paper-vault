#!/bin/bash

# PaperVault Uninstallation Script (User mode - no sudo required)

# Configuration
INSTALL_DIR="$HOME/.local/bin"
SCRIPT_NAME="pv"
CONFIG_DIR="$HOME/.config/paper-vault"
CONFIG_FILE="$CONFIG_DIR/pv.config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[UNINSTALL]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[UNINSTALL]${NC} $1"
}

print_error() {
    echo -e "${RED}[UNINSTALL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[UNINSTALL]${NC} $1"
}

# Function to remove the run script
remove_run_script() {
    local script_path="$INSTALL_DIR/$SCRIPT_NAME"
    
    if [ -f "$script_path" ]; then
        print_status "Removing $script_path"
        rm -f "$script_path"
        print_success "Run script removed"
    else
        print_warning "Run script not found at $script_path"
    fi
}

# Function to remove config files (with confirmation)
remove_config() {
    if [ -d "$CONFIG_DIR" ]; then
        print_warning "Configuration directory found at $CONFIG_DIR"
        read -p "Do you want to remove configuration files as well? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Removing configuration directory..."
            rm -rf "$CONFIG_DIR"
            print_success "Configuration removed"
        else
            print_status "Keeping configuration files at $CONFIG_DIR"
        fi
    else
        print_status "No configuration directory found"
    fi
}

# Function to check if any PaperVault processes are running
check_running_processes() {
    print_status "Checking for running PaperVault processes..."
    
    local pids=$(pgrep -f "node dist/server.js" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        print_warning "Found running PaperVault backend processes (PIDs: $pids)"
        read -p "Do you want to stop them? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo $pids | xargs kill -9 2>/dev/null
            print_success "Processes stopped"
        fi
    fi
}

# Function to optionally remove the install directory if empty
cleanup_install_dir() {
    if [ -d "$INSTALL_DIR" ] && [ -z "$(ls -A "$INSTALL_DIR")" ]; then
        print_status "Install directory is empty, removing it..."
        rmdir "$INSTALL_DIR" 2>/dev/null
        print_success "Removed empty directory: $INSTALL_DIR"
    fi
}

# Main uninstallation process
main() {
    print_status "Starting PaperVault uninstallation..."
    
    # Check for running processes
    check_running_processes
    
    # Remove the run script
    remove_run_script
    
    # Remove configuration (with confirmation)
    remove_config
    
    # Clean up install directory if empty
    cleanup_install_dir
    
    print_success "PaperVault has been uninstalled!"
    echo ""
    print_status "The repository directory was not removed: $(pwd)"
    print_status "You can delete it manually if desired"
}

# Run main function
main
