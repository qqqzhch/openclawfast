# 🦞 OpenClawFast — Fast CLI for OpenClaw

<p align="center">
  <strong>Instant OpenClaw CLI — No Node.js Required</strong>
</p>

<p align="center">
  <a href="https://github.com/qqqzhch/openclawfast/releases"><img src="https://img.shields.io/github/v/release/qqqzhch/openclawfast?style=for-the-badge" alt="GitHub release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-success?style=for-the-badge" alt="Platform">
</p>

---

## What is OpenClawFast?

**OpenClawFast** is a standalone executable wrapper for [OpenClaw](https://github.com/openclaw/openclaw) — the personal AI assistant that runs on your own devices.

It packages the OpenClaw CLI as a **Single Executable Application (SEA)**, so you can:

- ✅ **No Node.js installation required** — just download and run
- ✅ **No npm/pnpm/bun needed** — single binary, zero dependencies
- ✅ **No Docker overhead** — native performance, instant startup
- ✅ **Faster than source install** — no build step, no compilation

> **Note**: OpenClawFast is a packaging layer for OpenClaw. All features, channels, and capabilities come from [OpenClaw](https://github.com/openclaw/openclaw). For full documentation, visit [docs.openclaw.ai](https://docs.openclaw.ai).

---

## Installation

### Windows

```powershell
# Download from GitHub Releases
# https://github.com/qqqzhch/openclawfast/releases

# Extract and run
.\openclaw.exe --version
```

### macOS

```bash
# Download from GitHub Releases
# https://github.com/qqqzhch/openclawfast/releases

# Make executable and run
chmod +x openclaw
./openclaw --version
```

### Linux

```bash
# Download from GitHub Releases
# https://github.com/qqqzhch/openclawfast/releases

# Make executable and run
chmod +x openclaw
./openclaw --version
```

---

## Quick Start

```bash
# Start onboarding wizard
./openclaw onboard --install-daemon

# Run the gateway
./openclaw gateway --port 18789

# Send a message
./openclaw message send --to +1234567890 --message "Hello!"

# Talk to the assistant
./openclaw agent --message "What's on my calendar today?"
```

> **Tip**: On Windows, use `.\openclaw.exe` instead of `./openclaw`. You can also add the executable to your PATH or rename it to just `openclaw` (or `openclaw.exe` on Windows) for convenience.

---

## Comparison: OpenClawFast vs Other Methods

| Method | Node.js Required | Install Time | Startup Time | Disk Space |
|--------|------------------|--------------|--------------|------------|
| **OpenClawFast** | ❌ No | ~10s (download) | Instant | ~124 MB |
| npm install | ✅ Yes | ~30-60s | ~1-2s | ~500 MB+ |
| Source build | ✅ Yes | ~5-10 min | ~1-2s | ~1 GB+ |
| Docker | ❌ No (container) | ~2-5 min | ~3-5s | ~1 GB+ |

**OpenClawFast is the fastest way to get started with OpenClaw!**

---

## Supported Platforms

| Platform | Architecture | Download |
|----------|-------------|----------|
| Windows | x64 | `openclaw-VERSION-win32-x64.zip` |
| macOS | x64 (Intel) | `openclaw-VERSION-darwin-x64.tar.gz` |
| macOS | arm64 (M1/M2) | `openclaw-VERSION-darwin-arm64.tar.gz` |
| Linux | x64 | `openclaw-VERSION-linux-x64.tar.gz` |
| Linux | arm64 | `openclaw-VERSION-linux-arm64.tar.gz` |

---

## Features

OpenClawFast includes all OpenClaw CLI features:

- **Multi-channel messaging**: WhatsApp, Telegram, Slack, Discord, Signal, iMessage, and more
- **AI Assistant**: Chat with AI through your favorite messaging apps
- **Gateway**: Local WebSocket control plane for sessions and events
- **Voice**: Talk mode and voice wake words (macOS/iOS/Android)
- **Browser control**: Automated Chrome/Chromium for web tasks
- **Skills**: Extend functionality with custom skills

---

## Commands

```bash
./openclaw --help                    # Show all commands
./openclaw onboard                   # Interactive setup wizard
./openclaw gateway                   # Start the gateway server
./openclaw agent --message "..."     # Talk to the assistant
./openclaw message send --to ...     # Send a message
./openclaw doctor                    # Health checks and fixes
./openclaw --version                 # Show version
```

> On Windows, replace `./openclaw` with `.\openclaw.exe`

---

## Building from Source

If you want to build OpenClawFast yourself:

```bash
git clone https://github.com/qqqzhch/openclawfast.git
cd openclawfast

# Install dependencies
pnpm install

# Build the project
pnpm build

# Create SEA executable
node scripts/build-sea.mjs
```

The executable will be created in `dist-sea/`.

---

## Requirements

- **Runtime**: None! OpenClawFast is self-contained.
- **For some features**: 
  - Browser automation: Chrome/Chromium (auto-installed)
  - Voice features: macOS/iOS/Android companion apps

---

## Documentation

Full OpenClaw documentation: [docs.openclaw.ai](https://docs.openclaw.ai)

- [Getting Started](https://docs.openclaw.ai/start/getting-started)
- [Channels](https://docs.openclaw.ai/channels)
- [Gateway](https://docs.openclaw.ai/gateway)
- [Security](https://docs.openclaw.ai/gateway/security)

---

## Credits

OpenClawFast is a packaging project for [OpenClaw](https://github.com/openclaw/openclaw).

- **OpenClaw**: The upstream project — [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)
- **OpenClawFast**: SEA packaging — [github.com/qqqzhch/openclawfast](https://github.com/qqqzhch/openclawfast)

---

## License

MIT License — see [LICENSE](LICENSE)
