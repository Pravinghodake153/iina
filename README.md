# IINA + yt-dlp Streaming Helper

A production configuration and plugin repository for optimizing online media playback in [IINA](https://iina.io) on macOS using [yt-dlp](https://github.com/yt-dlp/yt-dlp).

---

## Overview

IINA is a modern media player built for macOS. Under the hood, IINA uses **mpv** for audio/video playback and **yt-dlp** to extract media streams from web links.

Many web video streams fail or buffer because:
1. Media servers require specific HTTP headers (such as `Referer` or `Origin`) to authorize playback.
2. Streams are delivered as segmented HTTP Live Streaming manifests (`.m3u8` HLS) requiring continuous reconnection and adaptive bitrate switching.
3. Audio and video tracks are delivered separately and must be demuxed smoothly.

This repository provides:
* **Extractor Plugin Scaffold:** A clean Python plugin structure for `yt-dlp` to inject required authorization headers and extract `.m3u8` manifests.
* **MX Player Reference Helper:** Implementation demonstrating how to extract streams and state metadata from MX Player (`mxplayer.in`).
* **Optimized mpv Configuration:** Cache, buffering, and format-selection parameters tailored for macOS.

---

## System Architecture

```
User pastes URL into IINA (File -> Open URL)
                     │
                     ▼
             IINA Player UI
                     │
                     ▼
           mpv Playback Engine
                     │
                     ▼
               yt-dlp CLI
                     │
                     ▼ Matches URL
       Custom Extractor Plugin (Python)
         ├── 1. Fetches webpage / state JSON
         ├── 2. Extracts .m3u8 HLS playlist
         └── 3. Attaches Referer & Origin headers
                     │
                     ▼
   mpv streams video & audio chunks via CDN
                     │
                     ▼
            Smooth Playback in IINA
```

---

## Directory Structure

```text
iina/
├── README.md                      # Documentation and usage guide
├── pyproject.toml                 # Packaging specification for yt-dlp plugins
├── config/
│   └── mpv.conf                   # Streaming and cache settings for mpv
└── yt_dlp_plugins/
    └── extractor/
        ├── __init__.py            # Namespace package initializer
        └── mxplayer_helper.py     # Stream extraction and header injection helper
```

---

## Prerequisites (macOS)

To use custom extractors and stream web videos in IINA, ensure you have the following installed:

1. **Install IINA:**
   Download from [iina.io](https://iina.io) or install via Homebrew:
   ```bash
   brew install --cask iina
   ```

2. **Install yt-dlp and FFmpeg:**
   ```bash
   brew install yt-dlp ffmpeg
   ```
   * *Why FFmpeg?* FFmpeg allows `yt-dlp` and `mpv` to join split audio and video tracks without quality loss.

---

## Installation & Setup

### 1. Install the yt-dlp Plugin

To enable the custom extractor plugin globally on your Mac:

```bash
# 1. Create the standard yt-dlp plugin directory
mkdir -p ~/.config/yt-dlp/plugins/iina-helper/yt_dlp_plugins/extractor

# 2. Copy the plugin file into place
cp yt_dlp_plugins/extractor/mxplayer_helper.py ~/.config/yt-dlp/plugins/iina-helper/yt_dlp_plugins/extractor/
```

Verify that `yt-dlp` detects the plugin:
```bash
yt-dlp --list-extractors | grep -i mxplayer
```

### 2. Apply Optimized mpv Streaming Settings

Copy the provided `mpv.conf` to your personal configuration folder:

```bash
mkdir -p ~/.config/mpv
cp config/mpv.conf ~/.config/mpv/mpv.conf
```

Key settings included in `mpv.conf`:
* `cache=yes`: Prevents video stuttering on slower internet connections.
* `demuxer-max-bytes=150M`: Allocates up to 150MB of memory buffer for continuous playback.
* `stream-buffer-size=4MiB`: Ensures responsive seeking in live and HLS streams.
* `user-agent`: Standard desktop browser identifier to avoid CDN access blocks.

### 3. Configure IINA Settings

1. Open **IINA**.
2. Press `Cmd + ,` to open **Settings**.
3. Go to the **Network** tab:
   * Check **Enable yt-dlp**.
   * Set **Custom yt-dlp path** to:
     * `/opt/homebrew/bin/yt-dlp` (for Apple Silicon Macs: M1, M2, M3, M4)
     * `/usr/local/bin/yt-dlp` (for Intel Macs)
4. (Optional) Go to the **Advanced** tab:
   * Check **Use config directory**.
   * Set the path to `~/.config/mpv`.

---

## How It Works (Concepts Explained Simply)

### 1. What is an Extractor?
When you paste `https://www.mxplayer.in/show/...` into IINA, the media player does not know how to play the web page directly because a web page is full of HTML, styles, and buttons—not raw video.
An **extractor** is a Python script that acts like a translator. It visits the page, ignores the visual clutter, finds the exact stream URL (the `.m3u8` playlist), and hands it to the player.

### 2. Why Are HTTP Headers Needed?
Many servers check the `Referer` header of every incoming request. If a request comes from an external media player without a valid `Referer`, the server responds with `403 Forbidden` and cuts the connection.
The extractor solves this by attaching:
```python
custom_headers = {
    'Referer': 'https://www.mxplayer.in/',
    'Origin': 'https://www.mxplayer.in',
}
```
This tells the media server that the request is authorized, allowing the stream to start.

### 3. What is an `.m3u8` File?
An `.m3u8` file is a playlist for **HLS (HTTP Live Streaming)**. Instead of sending one massive 2-hour video file, the server splits the video into small 6-second fragments. The `.m3u8` file lists all these pieces so IINA can fetch them one by one.

---

## Troubleshooting

### Error: "Cannot open URL" or "No video formats found"
1. **Update yt-dlp:** Streaming websites frequently change their internal layouts. Keep yt-dlp updated:
   ```bash
   yt-dlp -U
   # Or if installed via Homebrew:
   brew upgrade yt-dlp
   ```
2. **Check yt-dlp Path in IINA:**
   Verify that IINA's Network tab points to the correct `yt-dlp` executable location. Run `which yt-dlp` in your terminal to confirm the path.

### Video Plays but There is No Sound
Install FFmpeg (`brew install ffmpeg`). Without FFmpeg, split audio streams cannot be merged during playback.

---

## License

This project is licensed under the MIT License.
