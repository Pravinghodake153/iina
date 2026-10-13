# Stream Helper for IINA

A native plugin and streaming configuration repository for [IINA](https://iina.io) on macOS.

This repository is formatted as a native IINA plugin package so you can **install it directly inside IINA by pasting the GitHub repository link**.

---

## Quick Install in IINA (One-Click Setup)

You can install this plugin directly inside IINA without touching the terminal:

1. Open **IINA**.
2. Open Settings by pressing `Cmd + ,` (or go to **IINA** -> **Settings** in the top menu).
3. Click the **Plugins** tab on the left sidebar.
4. Click **Install from GitHub...** (or the `+` button at the bottom).
5. Paste your repository link:
   ```text
   Pravinghodake153/iina
   ```
   *(or `https://github.com/Pravinghodake153/iina`)*
6. Click **Install**.

Once installed, **Stream Helper** will appear in your top menu bar under **Plugin** -> **Stream Helper** whenever a video window is active.

---

## Features

* **Direct GitHub Installation:** Includes `Info.json` with auto-update metadata recognized by IINA's built-in plugin manager.
* **In-App Menu Controls:**
  * **Optimize Buffer (150MB):** Dynamically expands the stream buffer so multi-part `.m3u8` playlists and live streams do not pause or stutter.
  * **Enable Stream Reconnection:** Configures a 15-second reconnect timeout and a 4MB burst buffer to recover from dropouts.
  * **Check Stream Cache Status:** Displays on-screen display (OSD) feedback showing how many seconds of video are currently buffered in RAM.
  * **Apply Browser User-Agent:** Prevents content delivery networks (CDNs) from blocking playback with HTTP 403 Forbidden errors.
* **yt-dlp Backend Support:** Contains a Python extractor helper demonstrating how `yt-dlp` extracts `.m3u8` streams and injects `Referer` and `Origin` headers.

---

## Repository Structure

```text
Pravinghodake153/iina/
├── Info.json                      # Native IINA plugin manifest for GitHub installation
├── plugin.json                    # Manifest alias
├── index.js                       # JavaScript entry script executed inside IINA
├── pyproject.toml                 # yt-dlp Python package specification
├── README.md                      # Setup and usage guide
├── config/
│   └── mpv.conf                   # Standalone mpv caching and stream configuration
└── yt_dlp_plugins/
    └── extractor/
        ├── __init__.py            # yt-dlp plugin namespace initializer
        └── mxplayer_helper.py     # Python extractor helper for HLS and headers
```

---

## Backend Requirements (For yt-dlp Web Extraction)

While the UI plugin installs directly inside IINA, web stream link extraction relies on `yt-dlp` and `ffmpeg` installed on your Mac:

1. **Install via Homebrew:**
   ```bash
   brew install yt-dlp ffmpeg
   ```
2. **Verify IINA Network Settings:**
   * Open **IINA** -> **Settings** (`Cmd + ,`) -> **Network**.
   * Make sure **Enable yt-dlp** is checked.
   * Path should point to `/opt/homebrew/bin/yt-dlp` (Apple Silicon) or `/usr/local/bin/yt-dlp` (Intel).

---

## Concepts Explained Simply

1. **What is `Info.json`?**
   `Info.json` is like an ID card for the plugin. When you paste your GitHub link into IINA, IINA reads this file first to learn the plugin's name, version, and which script (`index.js`) to run.
2. **What does `index.js` do?**
   It communicates with IINA's internal video engine (`mpv`). When you click a menu item in IINA, `index.js` tells the player to expand its memory buffer or display a notification on your screen.
3. **What is an `.m3u8` file?**
   Modern web videos are split into hundreds of small 6-second clips. An `.m3u8` file is the master list (playlist) that tells the player where each clip is located so it can play them back seamlessly.

---

## Troubleshooting

* **IINA says "Cannot find Info.json":**
  Ensure you typed `Pravinghodake153/iina` correctly in the **Install from GitHub** box.
* **Plugin menu is greyed out:**
  IINA activates plugin menus when a video or player window is open. Open any media file or stream URL to access the menu items.
* **Stream fails with 403 Forbidden:**
  Select **Plugin** -> **Stream Helper** -> **Apply Browser User-Agent** or ensure your `yt-dlp` installation is up-to-date (`brew upgrade yt-dlp`).

---

## License

This project is licensed under the MIT License.
