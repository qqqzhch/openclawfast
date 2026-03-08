#!/bin/bash

#######################################################################
# OpenClaw CLI - SEA Binary Installer
# 
# This script downloads and installs the OpenClaw CLI standalone executable.
# No Node.js or pnpm installation required.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/install-sea.sh | bash
#   or
#   wget -qO- https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/install-sea.sh | bash
#
# Environment Variables:
#   OPENCLAW_VERSION    - Version to install (default: latest)
#   OPENCLAW_INSTALL_DIR - Installation directory (default: /usr/local/bin)
#   OPENCLAW_PLATFORM   - Override platform detection (darwin/linux)
#   OPENCLAW_ARCH       - Override architecture detection (x64/arm64)
#######################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Configuration
OPENCLAW_VERSION="${OPENCLAW_VERSION:-latest}"
OPENCLAW_INSTALL_DIR="${OPENCLAW_INSTALL_DIR:-/usr/local/bin}"
OPENCLAW_PLATFORM="${OPENCLAW_PLATFORM:-$(uname -s | tr '[:upper:]' '[:lower:]')}"
OPENCLAW_ARCH="${OPENCLAW_ARCH:-$(uname -m)}"

# Normalize architecture
case "$OPENCLAW_ARCH" in
    x86_64|amd64)
        OPENCLAW_ARCH="x64"
        ;;
    arm64|aarch64)
        OPENCLAW_ARCH="arm64"
        ;;
    *)
        log_error "Unsupported architecture: $OPENCLAW_ARCH"
        exit 1
        ;;
esac

# GitHub repository
GITHUB_REPO="openclaw/openclaw"
GITHUB_API_URL="https://api.github.com/repos/$GITHUB_REPO"

# Get latest version
get_latest_version() {
    if [ "$OPENCLAW_VERSION" = "latest" ]; then
        log_info "Fetching latest version..."
        OPENCLAW_VERSION=$(curl -fsSL "$GITHUB_API_URL/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')
        
        if [ -z "$OPENCLAW_VERSION" ]; then
            log_error "Failed to fetch latest version"
            exit 1
        fi
    fi
    
    log_info "Installing OpenClaw CLI v$OPENCLAW_VERSION"
}

# Download binary
download_binary() {
    local platform="$OPENCLAW_PLATFORM"
    local arch="$OPENCLAW_ARCH"
    local version="$OPENCLAW_VERSION"
    
    # Construct download URL
    local filename="openclaw-${version}-${platform}-${arch}.tar.gz"
    local download_url="https://github.com/${GITHUB_REPO}/releases/download/v${version}/${filename}"
    
    log_info "Downloading from: $download_url"
    
    # Create temporary directory
    local tmp_dir=$(mktemp -d)
    local tmp_file="${tmp_dir}/${filename}"
    
    # Download
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$download_url" -o "$tmp_file"
    elif command -v wget >/dev/null 2>&1; then
        wget -q "$download_url" -O "$tmp_file"
    else
        log_error "Neither curl nor wget is available"
        exit 1
    fi
    
    # Extract
    log_info "Extracting..."
    tar -xzf "$tmp_file" -C "$tmp_dir"
    
    # Find executable
    local executable=$(find "$tmp_dir" -name "openclaw*" -type f -perm -111 | head -n 1)
    
    if [ -z "$executable" ]; then
        log_error "Could not find executable in archive"
        exit 1
    fi
    
    echo "$executable"
}

# Install binary
install_binary() {
    local executable="$1"
    local target="${OPENCLAW_INSTALL_DIR}/openclaw"
    
    log_info "Installing to: $target"
    
    # Check if we need sudo
    if [ ! -w "$OPENCLAW_INSTALL_DIR" ]; then
        log_info "Administrator privileges required for installation to $OPENCLAW_INSTALL_DIR"
        sudo mkdir -p "$OPENCLAW_INSTALL_DIR"
        sudo cp "$executable" "$target"
        sudo chmod +x "$target"
    else
        mkdir -p "$OPENCLAW_INSTALL_DIR"
        cp "$executable" "$target"
        chmod +x "$target"
    fi
    
    log_success "Installed to: $target"
}

# Verify installation
verify_installation() {
    local target="${OPENCLAW_INSTALL_DIR}/openclaw"
    
    log_info "Verifying installation..."
    
    if ! command -v openclaw >/dev/null 2>&1; then
        log_warning "openclaw is not in your PATH"
        log_info "Add the following to your shell profile:"
        echo ""
        echo "    export PATH=\"\$PATH:$OPENCLAW_INSTALL_DIR\""
        echo ""
        return
    fi
    
    # Test version
    local installed_version=$("$target" --version 2>&1 || echo "unknown")
    log_success "OpenClaw CLI $installed_version is ready!"
    
    # Test basic command
    log_info "Running 'openclaw doctor' to verify..."
    "$target" doctor || true
}

# Cleanup
cleanup() {
    if [ -n "$tmp_dir" ] && [ -d "$tmp_dir" ]; then
        rm -rf "$tmp_dir"
    fi
}

# Main
main() {
    echo ""
    echo "🦞 OpenClaw CLI Installer"
    echo ""
    
    # Check OS
    if [ "$OPENCLAW_PLATFORM" = "darwin" ]; then
        log_info "Platform: macOS ($OPENCLAW_ARCH)"
    elif [ "$OPENCLAW_PLATFORM" = "linux" ]; then
        log_info "Platform: Linux ($OPENCLAW_ARCH)"
    else
        log_error "Unsupported platform: $OPENCLAW_PLATFORM"
        exit 1
    fi
    
    # Trap for cleanup
    trap cleanup EXIT
    
    # Get version
    get_latest_version
    
    # Download
    local executable=$(download_binary)
    
    # Install
    install_binary "$executable"
    
    # Verify
    verify_installation
    
    echo ""
    log_success "Installation complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "  1. Run: openclaw setup"
    echo "  2. Configure your API keys"
    echo "  3. Start using: openclaw chat"
    echo ""
}

# Run
main "$@"
