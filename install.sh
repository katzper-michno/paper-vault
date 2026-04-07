#!/bin/bash

# PaperVault Installation Script

# Configuration
INSTALL_DIR="$HOME/.local/bin"
SCRIPT_NAME="pv"
CONFIG_DIR="$HOME/.config/paper-vault"
CONFIG_FILE="$CONFIG_DIR/pv.config.json"
RUN_SCRIPT_NAME="run.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INSTALL]${NC} $1" >&2
}

print_success() {
    echo -e "${GREEN}[INSTALL]${NC} $1" >&2
}

print_error() {
    echo -e "${RED}[INSTALL]${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}[INSTALL]${NC} $1" >&2
}

# Function to get the directory where this script is located
get_script_dir() {
    local source="${BASH_SOURCE[0]}"
    while [ -h "$source" ]; do
        local dir="$(cd -P "$(dirname "$source")" && pwd)"
        source="$(readlink "$source")"
        [[ $source != /* ]] && source="$dir/$source"
    done
    echo "$(cd -P "$(dirname "$source")" && pwd)"
}

# Function to create default config file
create_config() {
    print_status "Checking for existing config file..."
    
    if [ -f "$CONFIG_FILE" ]; then
        print_warning "Config file already exists at $CONFIG_FILE"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Keeping existing config file"
            return 0
        fi
    fi
    
    print_status "Creating config directory: $CONFIG_DIR"
    mkdir -p "$CONFIG_DIR"
    
    print_status "Creating default config file: $CONFIG_FILE"

    local repo_path="$1"

    cat > "$CONFIG_FILE" << EOF
{
  "BACKEND_PORT": "3001",
  "FRONTEND_PORT": "5173",
  "OPEN_ALEX_API_KEY": "",
  "VAULT_PATH": "${repo_path}/vault_example"
}
EOF
    
    print_success "Default config file created"
    print_status "You can edit the configuration at: $CONFIG_FILE"
}

# Function to prepare the run script with embedded REPO_PATH
prepare_run_script() {
    local repo_path="$1"
    local source_run_script="$repo_path/$RUN_SCRIPT_NAME"
    local temp_dir=$(mktemp -d)
    local temp_run_script="${temp_dir}/pv-run-temp.sh"
    
    print_status "Checking for run script at: $source_run_script"
    
    # Check if run.sh exists
    if [ ! -f "$source_run_script" ]; then
        print_error "run.sh not found in repository root: $source_run_script"
        print_error "Please ensure run.sh exists in the same directory as install.sh"
        exit 1
    fi
    
    print_status "Preparing run script with REPO_PATH=$repo_path"
    
    # Copy the run script to temp location
    cp "$source_run_script" "$temp_run_script"
    
    # Replace or add REPO_PATH at the beginning of the script
    # Check if REPO_PATH is already defined in the script
    if grep -q "^REPO_PATH=" "$temp_run_script"; then
        # Replace existing REPO_PATH line
        sed -i "s|^REPO_PATH=.*|REPO_PATH=\"$repo_path\"|" "$temp_run_script"
    else
        # Insert REPO_PATH after the shebang
        sed -i "1a\\\n# Repository path - set during installation\nREPO_PATH=\"$repo_path\"" "$temp_run_script"
    fi
    
    echo "$temp_run_script"
}

# Main installation process
main() {
    print_status "Starting PaperVault installation..."
    
    # Get the directory where install.sh is located
    local script_dir=$(get_script_dir)
    print_status "Installation script located at: $script_dir"
    
    # Verify this is a PaperVault repository
    if [ ! -d "$script_dir/pv_back" ] || [ ! -d "$script_dir/pv_front" ]; then
        print_error "This doesn't appear to be a PaperVault repository root."
        print_error "Make sure install.sh is in the same directory as pv_back/ and pv_front/"
        print_error "Current directory contents:"
        ls -la "$script_dir"
        exit 1
    fi
    
    print_success "Verified PaperVault repository at: $script_dir"
    
    # Create config file
    create_config "$script_dir"
    
    # Prepare run script with embedded path
    local temp_run_script=$(prepare_run_script "$script_dir")
    
    # Move prepared run script to install directory
    print_status "Installing run script to $INSTALL_DIR/$SCRIPT_NAME"
    mkdir -p "$INSTALL_DIR"
    cp "$temp_run_script" "$INSTALL_DIR/$SCRIPT_NAME"
    
    # Make executable
    print_status "Making script executable..."
    chmod +x "$INSTALL_DIR/$SCRIPT_NAME"
    
    # Clean up temp file
    rm -f "$temp_run_script"
    
    print_success "PaperVault has been installed successfully!"
    echo ""
    echo "  Installation location: $INSTALL_DIR/$SCRIPT_NAME"
    echo "  Configuration file: $CONFIG_FILE"
    echo "  Repository path: $script_dir"
    echo "  Run script source: $script_dir/$RUN_SCRIPT_NAME"
    echo ""
    print_status "You can now run 'pv' from anywhere to start PaperVault"
    echo ""
    
    # Test if installation directory is in PATH
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        print_warning "$INSTALL_DIR is not in your PATH"
        print_warning "Add this to your ~/.bashrc or ~/.zshrc:"
        echo "  export PATH=\"$INSTALL_DIR:\$PATH\""
    fi
}

# Run main function
main
