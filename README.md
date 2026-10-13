# Stream Helper for IINA

A universal streaming engine and native plugin repository for [IINA](https://iina.io) on macOS.

This plugin ensures web video links play cleanly with **both synchronized video and audio**, automatic **HTTP Referer / Origin header injection**, and **stream buffer optimization**.

---

## Quick Install in IINA (One-Click Setup)

Install directly inside IINA without touching the terminal:

1. Open **IINA**.
2. Open Settings by pressing `Cmd + ,` (or go to **IINA** -> **Settings** in the top menu).
3. Click the **Plugins** tab on the left sidebar.
4. Click **Install from GitHub...** (or click the `+` button at the bottom).
5. Paste your repository identifier:
   ```text
   Pravinghodake153/iina
   ```
   *(or `https://github.com/Pravinghodake153/iina`)*
6. Click **Install** (or **Check for Updates** if already installed).

---

## Universal Streaming Features

### 1. Universal Video + Audio Protocol Matching
Many streaming platforms (like MX Player, Hotstar, and various OTT networks) provide video in one protocol (such as HLS `.m3u8`) and audio in another (such as DASH `.mpd`). 
When players attempt to play split protocols, the audio is dropped.

Stream Helper enforces a **5-tier universal format selector**:
1. **Matched DASH:** Pairs DASH video with DASH audio from the same manifest.
2. **Matched HLS:** Pairs HLS video with HLS audio from the same playlist.
3. **Combined Stream:** Selects standard single files (MP4/WebM) containing both video and audio.
4. **Best Video + Best Audio:** Fallback for sites (like YouTube/Vimeo) where FFmpeg merges separate tracks.
5. **Universal Fallback:** Selects the best playable stream if all filters are exhausted.

### 2. Automatic Header Injection (`on_load` Interceptor)
Websites block players that don't send legitimate browser request headers.
The plugin hooks into IINA's playback pipeline (`mpv.addHook("on_load")`):
* Automatically parses the web link's domain.
* Injects `Referer: <webpage_url>` and `Origin: <domain>`.
* Sends desktop Chrome `User-Agent`.
* Prevents `403 Forbidden` errors from Content Delivery Networks (CDNs).

### 3. Automatic Audio Track Activation
If a stream loads with multiple language tracks or starts muted/disabled, the plugin detects the silent state on `file-loaded` and automatically turns on the primary audio track.

### 4. High-Bitrate Cache (150MB Buffer)
Expands playback cache to 150MB in RAM to eliminate buffering and stuttering on multi-part live or on-demand streams.

---

## In-App Menu Controls

Whenever a stream is open in IINA, access the controls via **Plugin** -> **Stream Helper**:
* **Optimize & Sync Current Stream:** Re-applies universal protocol matching, audio auto-select, and buffer boost.
* **Force DASH Audio-Video Match:** Locks playback to matching DASH streams.
* **Force HLS Audio-Video Match:** Locks playback to matching HLS streams.
* **Cycle Audio Track:** Rapidly switches between available audio languages.
* **Check Stream Cache & Health:** Displays an on-screen display (OSD) banner showing buffered seconds and the active audio track.

---

## Repository Structure

```text
Pravinghodake153/iina/
├── Info.json                      # Native IINA plugin manifest for GitHub installation
├── plugin.json                    # Manifest alias
├── index.js                       # Universal streaming engine script executed in IINA
├── pyproject.toml                 # yt-dlp Python package specification
├── README.md                      # Comprehensive setup and usage guide
├── config/
│   └── mpv.conf                   # Standalone universal mpv configuration
└── yt_dlp_plugins/
    └── extractor/
        ├── __init__.py            # yt-dlp plugin namespace initializer
        └── mxplayer_helper.py     # Python extractor helper for HLS and headers
```

---

## Prerequisites (macOS)

For general web stream extraction:
```bash
brew install yt-dlp ffmpeg
```

In IINA:
* Go to **Settings** (`Cmd + ,`) -> **Network**.
* Ensure **Enable yt-dlp** is checked.
* Path: `/opt/homebrew/bin/yt-dlp` (Apple Silicon) or `/usr/local/bin/yt-dlp` (Intel).

---

## License

This project is licensed under the MIT License.
