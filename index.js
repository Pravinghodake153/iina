/**
 * Stream Helper - Native IINA Plugin
 * -----------------------------------
 * This script runs inside IINA's JavaScript runtime when the plugin is installed.
 * It provides interactive controls in the macOS menu bar under "Plugin" -> "Stream Helper".
 */

const { core, mpv, menu, console } = iina;

console.log("Stream Helper plugin initialized.");

// Automatically configure ytdl-format on startup to prevent audio/video protocol mismatch
// MX Player provides video in HLS and audio in DASH. Without protocol matching,
// IINA receives separate incompatible streams resulting in video with no sound.
try {
  mpv.set(
    "ytdl-format",
    "bestvideo[protocol*=dash]+bestaudio[protocol*=dash]/bestvideo+bestaudio/best"
  );
  console.log("Configured ytdl-format with DASH protocol matching.");
} catch (e) {
  console.log("Initial ytdl-format set failed: " + e);
}

// Create the top-level menu item in IINA's "Plugin" menu
const streamMenu = menu.item("Stream Helper");

// Submenu Item 1: Fix audio by enforcing matched stream protocols
streamMenu.addSubmenuItem(
  menu.item("Fix Missing Audio (Match Protocols)", () => {
    try {
      mpv.set(
        "ytdl-format",
        "bestvideo[protocol*=dash]+bestaudio[protocol*=dash]/bestvideo+bestaudio/best"
      );
      core.osd("Audio fix applied (DASH sync enabled)");
      console.log("Applied DASH protocol matching for audio-video sync.");
    } catch (err) {
      console.log("Error configuring audio fix: " + err);
      core.osd("Failed to apply audio fix");
    }
  })
);

// Submenu Item 2: Optimize buffer for streaming
streamMenu.addSubmenuItem(
  menu.item("Optimize Buffer (150MB)", () => {
    try {
      mpv.set("demuxer-max-bytes", 157286400); // 150MB in bytes
      mpv.set("demuxer-max-back-bytes", 52428800); // 50MB in bytes
      core.osd("Stream buffer increased to 150MB");
      console.log("Buffer optimization applied: 150MB forward, 50MB backward.");
    } catch (err) {
      console.log("Error configuring stream buffer: " + err);
      core.osd("Failed to update buffer size");
    }
  })
);

// Submenu Item 3: Enable auto-reconnection for unstable networks
streamMenu.addSubmenuItem(
  menu.item("Enable Stream Reconnection", () => {
    try {
      mpv.set("network-timeout", 15);
      mpv.set("stream-buffer-size", "4MiB");
      core.osd("Auto-reconnection enabled (15s timeout)");
      console.log("Network timeout and stream buffer size updated.");
    } catch (err) {
      console.log("Error configuring network reconnect: " + err);
      core.osd("Failed to configure reconnection");
    }
  })
);

// Submenu Item 4: Show active stream buffering status
streamMenu.addSubmenuItem(
  menu.item("Check Stream Cache Status", () => {
    try {
      const currentPath = mpv.getString("path") || "No media loaded";
      const cacheSeconds = mpv.getNumber("demuxer-cache-duration") || 0;
      const isPaused = mpv.getFlag("pause");

      if (currentPath === "No media loaded") {
        core.osd("No active stream playing");
      } else {
        const roundedCache = Math.round(cacheSeconds);
        core.osd(`Buffered: ${roundedCache}s | State: ${isPaused ? "Paused" : "Playing"}`);
      }
    } catch (err) {
      console.log("Error retrieving stream status: " + err);
      core.osd("Status check unavailable");
    }
  })
);

// Submenu Item 5: Apply Standard Browser Headers for CDN Verification
streamMenu.addSubmenuItem(
  menu.item("Apply Browser User-Agent", () => {
    try {
      const browserUA =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      mpv.set("user-agent", browserUA);
      core.osd("Browser User-Agent applied");
      console.log("User-agent updated to Chrome on macOS.");
    } catch (err) {
      console.log("Error setting user-agent: " + err);
      core.osd("Failed to set User-Agent");
    }
  })
);

// Register the menu in IINA's UI
menu.addItem(streamMenu);
