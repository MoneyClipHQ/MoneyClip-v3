import { z } from "zod";

// Video format types for adaptive streaming
export type VideoFormat = "webm" | "mp4" | "hls" | "dash";
export type VideoQuality = "360p" | "480p" | "720p" | "1080p" | "auto";

// Video quality configuration
export interface QualityConfig {
  height: number;
  bandwidth: number; // bits per second
  codec: string;
}

export const QUALITY_CONFIGS: Record<VideoQuality, QualityConfig | null> = {
  "360p": { height: 360, bandwidth: 800_000, codec: "h264" },
  "480p": { height: 480, bandwidth: 1_200_000, codec: "h264" },
  "720p": { height: 720, bandwidth: 2_500_000, codec: "h264" },
  "1080p": { height: 1080, bandwidth: 5_000_000, codec: "h264" },
  "auto": null, // Adaptive quality selection
};

// Adaptive streaming manifest types
export interface HLSManifest {
  type: "hls";
  masterPlaylist: string; // .m3u8 URL
  qualities: Array<{
    quality: VideoQuality;
    bandwidth: number;
    playlist: string; // quality-specific .m3u8 URL
  }>;
}

export interface DASHManifest {
  type: "dash";
  manifest: string; // .mpd URL
  qualities: Array<{
    quality: VideoQuality;
    bandwidth: number;
    representation: string;
  }>;
}

export type AdaptiveManifest = HLSManifest | DASHManifest;

// Device capability detection
export interface DeviceCapabilities {
  supportsHLS: boolean;
  supportsDASH: boolean;
  preferredFormat: VideoFormat;
  maxQuality: VideoQuality;
  isMobile: boolean;
  connection: "slow" | "medium" | "fast";
}

// Video conversion job
export const videoConversionJobSchema = z.object({
  videoId: z.string(),
  sourceFormat: z.enum(["webm", "mp4"]),
  targetFormats: z.array(z.enum(["hls", "dash", "mp4"])),
  qualities: z.array(z.enum(["360p", "480p", "720p", "1080p"])),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export type VideoConversionJob = z.infer<typeof videoConversionJobSchema>;

// Player support detection utilities
export const detectPlayerSupport = (): DeviceCapabilities => {
  const video = document.createElement('video');
  const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check HLS support (native on iOS Safari, via HLS.js on others)
  const supportsHLS = Boolean(
    video.canPlayType('application/vnd.apple.mpegurl') ||
    video.canPlayType('audio/mpegurl') ||
    (window as any).MediaSource // For HLS.js compatibility
  );
  
  // Check DASH support (via DASH.js)
  const supportsDASH = Boolean((window as any).MediaSource);
  
  // Estimate connection speed (simplified)
  const connection = (navigator as any).connection?.effectiveType || "unknown";
  const connectionSpeed = connection === "4g" ? "fast" : 
                         connection === "3g" ? "medium" : "slow";
  
  // Determine preferred format
  let preferredFormat: VideoFormat = "mp4"; // Safe fallback
  if (isMobile && supportsHLS) {
    preferredFormat = "hls"; // iOS Safari native HLS
  } else if (supportsDASH) {
    preferredFormat = "dash"; // Desktop with DASH.js
  } else if (supportsHLS) {
    preferredFormat = "hls"; // Desktop with HLS.js
  }
  
  // Determine max quality based on device
  const maxQuality: VideoQuality = isMobile ? "720p" : "1080p";
  
  return {
    supportsHLS,
    supportsDASH,
    preferredFormat,
    maxQuality,
    isMobile,
    connection: connectionSpeed,
  };
};

// Manifest generation utilities
export const generateHLSMasterPlaylist = (qualities: VideoQuality[]): string => {
  const header = "#EXTM3U\n#EXT-X-VERSION:6\n\n";
  
  const streams = qualities
    .filter(q => q !== "auto" && QUALITY_CONFIGS[q])
    .map(quality => {
      const config = QUALITY_CONFIGS[quality]!;
      return `#EXT-X-STREAM-INF:BANDWIDTH=${config.bandwidth},RESOLUTION=${Math.round(config.height * 16/9)}x${config.height}\n${quality}/playlist.m3u8`;
    })
    .join("\n\n");
  
  return header + streams;
};

export const generateDASHManifest = (qualities: VideoQuality[]): string => {
  const validQualities = qualities.filter(q => q !== "auto" && QUALITY_CONFIGS[q]);
  
  const adaptationSet = validQualities
    .map(quality => {
      const config = QUALITY_CONFIGS[quality]!;
      return `    <Representation id="${quality}" bandwidth="${config.bandwidth}" width="${Math.round(config.height * 16/9)}" height="${config.height}">
      <SegmentTemplate media="${quality}/segment_$Number$.m4s" initialization="${quality}/init.mp4" startNumber="1" timescale="1000"/>
    </Representation>`;
    })
    .join("\n");
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="PT0S" profiles="urn:mpeg:dash:profile:isoff-live:2011">
  <Period>
    <AdaptationSet mimeType="video/mp4" codecs="avc1.42E01E">
${adaptationSet}
    </AdaptationSet>
  </Period>
</MPD>`;
};