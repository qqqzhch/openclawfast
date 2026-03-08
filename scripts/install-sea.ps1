#######################################################################
# OpenClaw CLI - SEA Binary Installer for Windows
# 
# This script downloads and installs the OpenClaw CLI standalone executable.
# No Node.js or pnpm installation required.
#
# Usage:
#   Invoke-Expression (Invoke-RestMethod https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/install-sea.ps1)
#
# Parameters:
#   -Version        - Version to install (default: latest)
#   -InstallDir     - Installation directory (default: C:\Program Files\OpenClaw)
#   -AddToPath      - Add to system PATH (default: true)
#######################################################################

param(
    [string]$Version = "latest",
    [string]$InstallDir = "C:\Program Files\OpenClaw",
    [bool]$AddToPath = $true
)

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] " -ForegroundColor Blue -NoNewline
    Write-Host $Message
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

# Configuration
$GitHubRepo = "openclaw/openclaw"
$GitHubApiUrl = "https://api.github.com/repos/$GitHubRepo"
$Platform = "win32"
$Arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }

# Get latest version
function Get-LatestVersion {
    if ($Version -eq "latest") {
        Write-Info "Fetching latest version..."
        
        try {
            $release = Invoke-RestMethod -Uri "$GitHubApiUrl/releases/latest" -UseBasicParsing
            $Version = $release.tag_name -replace '^v', ''
            
            if (-not $Version) {
                throw "Failed to extract version from release"
            }
        }
        catch {
            Write-Error "Failed to fetch latest version: $_"
            exit 1
        }
    }
    
    Write-Info "Installing OpenClaw CLI v$Version"
    return $Version
}

# Download binary
function Download-Binary {
    param([string]$Version)
    
    $filename = "openclaw-$Version-$Platform-$Arch.zip"
    $downloadUrl = "https://github.com/$GitHubRepo/releases/download/v$Version/$filename"
    
    Write-Info "Downloading from: $downloadUrl"
    
    # Create temporary directory
    $tmpDir = New-TemporaryDirectory
    
    try {
        # Download
        $zipFile = Join-Path $tmpDir $filename
        Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
        
        # Extract
        Write-Info "Extracting..."
        Expand-Archive -Path $zipFile -DestinationPath $tmpDir -Force
        
        # Find executable
        $executable = Get-ChildItem -Path $tmpDir -Filter "openclaw*.exe" -File | Select-Object -First 1
        
        if (-not $executable) {
            throw "Could not find executable in archive"
        }
        
        return $executable.FullName
    }
    catch {
        Write-Error "Failed to download or extract: $_"
        exit 1
    }
}

# Create temporary directory
function New-TemporaryDirectory {
    $tmpDir = Join-Path $env:TEMP "openclaw-install-$(Get-Random)"
    New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
    return $tmpDir
}

# Install binary
function Install-Binary {
    param([string]$Executable)
    
    Write-Info "Installing to: $InstallDir"
    
    # Create directory if needed
    if (-not (Test-Path $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }
    
    # Copy executable
    $target = Join-Path $InstallDir "openclaw.exe"
    Copy-Item -Path $Executable -Destination $target -Force
    
    Write-Success "Installed to: $target"
    
    # Add to PATH
    if ($AddToPath) {
        Add-ToPath -Path $InstallDir
    }
    
    return $target
}

# Add to PATH
function Add-ToPath {
    param([string]$Path)
    
    Write-Info "Adding to PATH..."
    
    # Get current PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    
    # Check if already in PATH
    if ($currentPath -split ';' | Where-Object { $_ -eq $Path }) {
        Write-Info "Already in PATH"
        return
    }
    
    # Add to PATH
    try {
        $newPath = "$currentPath;$Path"
        [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
        Write-Success "Added to user PATH"
        
        # Update current session PATH
        $env:PATH = "$env:PATH;$Path"
    }
    catch {
        Write-Warning "Failed to add to PATH: $_"
        Write-Info "You may need to add '$Path' to your PATH manually"
    }
}

# Verify installation
function Verify-Installation {
    param([string]$Target)
    
    Write-Info "Verifying installation..."
    
    # Test version
    try {
        $version = & $Target --version 2>&1
        Write-Success "OpenClaw CLI $version is ready!"
    }
    catch {
        Write-Warning "Could not verify installation: $_"
    }
    
    # Test basic command
    Write-Info "Running 'openclaw doctor' to verify..."
    & $Target doctor
}

# Main
function Main {
    Write-Host ""
    Write-Host "🦞 OpenClaw CLI Installer for Windows" -ForegroundColor Cyan
    Write-Host ""
    
    # Check architecture
    Write-Info "Platform: Windows ($Arch)"
    
    # Get version
    $version = Get-LatestVersion
    
    # Download
    $executable = Download-Binary -Version $version
    
    # Install
    $target = Install-Binary -Executable $executable
    
    # Verify
    Verify-Installation -Target $target
    
    Write-Host ""
    Write-Success "Installation complete! 🎉"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Open a new terminal (to reload PATH)"
    Write-Host "  2. Run: openclaw setup"
    Write-Host "  3. Configure your API keys"
    Write-Host "  4. Start using: openclaw chat"
    Write-Host ""
}

# Run
try {
    Main
}
catch {
    Write-Error "Installation failed: $_"
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}
