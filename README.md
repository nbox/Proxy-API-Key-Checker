<p align="center">
  <img src="assets/logo.png" width="220" alt="API Key Health Checker logo " />
</p>

# API Key Health Checker

🌐 Read in: [English](README.md) | [Русский](README.ru.md) | [Español](README.es.md)

Desktop app to validate API keys for popular services and run batch checks with rate limits and reports. Supports OpenAI (ChatGPT), Google Gemini, YouTube Data API, and custom endpoints.

![Screenshot](assets/screenshot.png)

## 🍺 Homebrew (macOS)

Install:

```bash
brew install --cask nbox/tap/api-key-health-checker
```

Uninstall:

```bash
brew uninstall --cask --zap api-key-health-checker
```

## Download

Releases: https://github.com/nbox/API-Key-Health-Checker/releases

## macOS Gatekeeper

⚠️ macOS may block unsigned builds downloaded from GitHub. If you see a warning that the app can't be opened because it isn't signed and macOS offers to move it to the Trash, use one of the options below:

Option 1: Allow in System Settings -> Privacy & Security

- Try to open the app normally (double-click).
- Open System Settings -> Privacy & Security.
- Under the warning about API Key Health Checker, click Open Anyway.
- Confirm by clicking Open.

Option 2: Remove the quarantine attribute

```bash
xattr -dr com.apple.quarantine "/Applications/API Key Health Checker.app"
```

## Features

- Service adapters: OpenAI, Gemini, YouTube, Custom
- Batch checks with concurrency, random delay (jitter), retries, global RPS limiter
- Multiple parallel runs with live logs, stats, and summary
- Import keys from TXT/CSV/JSON, encoding selection, dedupe, format warnings
- Export reports to CSV/JSON (masked or full)
- UI languages: English (default), Russian, Spanish

## Proxy Checker

- Types: HTTP, HTTPS, SOCKS4, SOCKS5; per-line scheme (`http://`, `https://`, `socks4://`, `socks5://`) forces the type.
- Inputs: manual list, file import, and aggregator URLs (one per line; `#` comments allowed).
- Formats: `ip:port` or `user:pass@ip:port`; auto-normalize and dedupe.
- Check modes: validity or URL access with a configurable target URL.
- HTML search: one or multiple texts (OR). Non-headless reads only the first N KB.
- Headless browser: full page load with JS; optional screenshots (folder, max files, auto-delete, include failed).
- Headless + screenshots are available only in URL mode with HTML search enabled.
- Controls: speed limit is a soft latency threshold; timeout is a hard per-request cutoff. Plus retries, concurrency, max RPS, random delay + jitter, max proxies per run.
- Results: each proxy is checked per selected type; logs/exports include proxy type, check mode, target URL; summary includes per-type lists with copy/move-to-list.
- Summary workflow: split by proxy type, plus "Move to Proxy list" to re-check valid proxies under stricter settings (first run validity, then target URL).
- Bundled aggregator presets live in `src/renderer/lib/proxyAggregators` (examples; some URLs may be dead or region-blocked).

## Security and privacy

- Keys are sent only to the selected API endpoint
- No telemetry
- Use only keys you own or have permission to test
- Full export saves plain text keys (no encryption). Handle with care.

## Requirements

- Node.js 20+
- npm

## Quick start

```bash
npm install
npm run dev
```

## Build

```bash
git clone https://github.com/nbox/API-Key-Health-Checker.git
cd API-Key-Health-Checker
npm install
npm run build
npm run dist
```

Build output is written to `dist/`.
DMG output: `release/API Key Health Checker-1.0.0-{arch}.dmg`.
macOS build: run `npm run dist` on macOS to generate a `.dmg` in `release/`.
Windows build: run `npm run dist` on Windows to generate a `.exe` installer in `release/`.

## GitHub Actions release

- On push to `main` or tags `v*`
- Builds for macOS, Windows, and Linux
- Creates a GitHub Release with artifacts

## Custom service

Use the Custom adapter to define a base URL, path, auth type (bearer/header/query), and success status codes.

## Project structure

- `src/main`: Electron main process and execution engine
- `src/renderer`: UI (React + Tailwind)
- `src/shared`: shared types and utilities
