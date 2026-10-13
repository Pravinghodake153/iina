/**
 * Stream Helper - Universal Streaming Engine for IINA
 * ----------------------------------------------------
 * Automatically intercepts web URLs opened in IINA, injects the correct
 * HTTP Referer/Origin headers, and synchronizes video and audio streams
 * to prevent silent playback across all supported websites.
 */

const { core, mpv, menu, event, console } = iina;

console.log("Stream Helper: Universal Streaming Engine initializing...");

// Standard Desktop Browser User-Agent
const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Universal Format Selector Chain:
// 1. Matched DASH: Pairs DASH video with DASH audio (same manifest)
// 2. Matched HLS: Pairs HLS video with HLS audio (same playlist)
// 3. Combined stream: Direct video with audio included (single mp4/webm)
// 4. Best video + Best audio: Standard separated streams (e.g. YouTube)
// 5. Fallback: Any available best stream
const UNIVERSAL_YTDL_FORMAT =
  "bestvideo[protocol*=dash]+bestaudio[protocol*=dash]/bestvideo[protocol*=m3u8]+bestaudio[protocol*=m3u8]/best[vcodec!=none][acodec!=none]/bestvideo+bestaudio/best";

/**
 * Configure baseline player properties
 */
function applyBaselineSettings() {
  try {
    mpv.set("ytdl", true);
    mpv.set("ytdl-format", UNIVERSAL_YTDL_FORMAT);
    mpv.set("user-agent", DESKTOP_USER_AGENT);
    mpv.set("cache", true);
    mpv.set("demuxer-max-bytes", 157286400); // 150MB buffer
    mpv.set("demuxer-max-back-bytes", 52428800); // 50MB back buffer
    mpv.set("stream-buffer-size", "4MiB");
    mpv.set("network-timeout", 20);
    console.log("Stream Helper: Baseline settings applied.");
  } catch (err) {
    console.log("Stream Helper: Error setting baseline properties: " + err);
  }
}

applyBaselineSettings();

/**
 * Hook: on_load
 * Triggers before any stream or file is loaded.
 * Dynamically detects website links and injects matching Referer and Origin headers.
 */
mpv.addHook("on_load", 50, (next) => {
  try {
    const currentUrl = mpv.getString("stream-open-filename");

    if (currentUrl && (currentUrl.startsWith("http://") || currentUrl.startsWith("https://"))) {
      try {
        // Extract protocol and domain (e.g. https://www.example.com)
        const parsedUrl = new URL(currentUrl);
        const origin = `${parsedUrl.protocol}//${parsedUrl.host}`;

        // Set referrer and browser headers so the CDN allows playback
        mpv.set("referrer", currentUrl);
        mpv.set("user-agent", DESKTOP_USER_AGENT);
        mpv.set("http-header-fields", [
          `Referer: ${currentUrl}`,
          `Origin: ${origin}`,
          `User-Agent: ${DESKTOP_USER_AGENT}`
        ]);

        console.log(`Stream Helper: Injected headers for host ${parsedUrl.host}`);
      } catch (urlErr) {
        // If URL parsing fails, still pass the full string as referrer
        mpv.set("referrer", currentUrl);
      }
    }
  } catch (err) {
    console.log("Stream Helper: Hook on_load encountered an error: " + err);
  }

  // Continue playback flow
  if (typeof next === "function") {
    next();
  }
});

/**
 * Event: iina.file-loaded
 * Runs once the media file or stream is loaded into the player.
 * Checks whether an audio track is active, and automatically enables audio if silent.
 */
event.on("iina.file-loaded", () => {
  try {
    const path = mpv.getString("path") || "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      // Check audio track status
      const currentAid = mpv.getString("aid");
      if (currentAid === "no" || currentAid === "0") {
        // Audio was disabled or unselected; auto-select first audio track
        mpv.set("aid", "auto");
        core.osd("Audio stream auto-activated");
        console.log("Stream Helper: Auto-activated audio track for stream.");
      }
    }
  } catch (err) {
    console.log("Stream Helper: Event file-loaded error: " + err);
  }
});

// ==========================================
// User Interface: In-App Menu Controls
// ==========================================
const streamMenu = menu.item("Stream Helper");

// Item 1: Optimize & Sync Active Stream
streamMenu.addSubmenuItem(
  menu.item("Optimize & Sync Current Stream", () => {
    try {
      applyBaselineSettings();
      mpv.set("aid", "auto");
      core.osd("Stream synced (Universal format & 150MB buffer active)");
    } catch (e) {
      core.osd("Optimization failed");
    }
  })
);

// Item 2: Force DASH Protocol (Best for Indian OTT & segmented platforms)
streamMenu.addSubmenuItem(
  menu.item("Force DASH Audio-Video Match", () => {
    try {
      mpv.set(
        "ytdl-format",
        "bestvideo[protocol*=dash]+bestaudio[protocol*=dash]/best"
      );
      core.osd("Format set to matched DASH");
    } catch (e) {
      core.osd("Failed to set DASH format");
    }
  })
);

// Item 3: Force HLS Protocol (Best for standard live streams)
streamMenu.addSubmenuItem(
  menu.item("Force HLS Audio-Video Match", () => {
    try {
      mpv.set(
        "ytdl-format",
        "bestvideo[protocol*=m3u8]+bestaudio[protocol*=m3u8]/best"
      );
      core.osd("Format set to matched HLS");
    } catch (e) {
      core.osd("Failed to set HLS format");
    }
  })
);

// Item 4: Cycle / Select Audio Language Track
streamMenu.addSubmenuItem(
  menu.item("Cycle Audio Track", () => {
    try {
      mpv.command("cycle", ["audio"]);
      core.osd("Cycled to next audio track");
    } catch (e) {
      core.osd("Unable to cycle audio track");
    }
  })
);

// Item 5: Buffer & Stream Status
streamMenu.addSubmenuItem(
  menu.item("Check Stream Cache & Health", () => {
    try {
      const currentPath = mpv.getString("path") || "No media loaded";
      const cacheSeconds = mpv.getNumber("demuxer-cache-duration") || 0;
      const aid = mpv.getString("aid") || "none";

      if (currentPath === "No media loaded") {
        core.osd("No active stream");
      } else {
        core.osd(`Buffered: ${Math.round(cacheSeconds)}s | Audio Track: ${aid}`);
      }
    } catch (e) {
      core.osd("Status check unavailable");
    }
  })
);

menu.addItem(streamMenu);
console.log("Stream Helper: Menu registered.");
