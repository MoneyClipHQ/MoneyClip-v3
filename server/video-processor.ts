import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { ObjectStorageService } from './objectStorage';
import type { VideoConversionJob, VideoQuality, AdaptiveManifest } from '@shared/video-formats';
import { QUALITY_CONFIGS, generateHLSMasterPlaylist, generateDASHManifest } from '@shared/video-formats';

export class VideoProcessor {
  private objectStorage: ObjectStorageService;
  private tempDir: string;

  constructor() {
    this.objectStorage = new ObjectStorageService();
    this.tempDir = '/tmp/video-processing';
  }

  async ensureTempDir(): Promise<void> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process video for adaptive streaming
   * Creates HLS and DASH manifests with multiple quality levels
   */
  async processVideoForStreaming(
    sourceVideoPath: string,
    videoId: string,
    options: Partial<VideoConversionJob> = {}
  ): Promise<{ hls?: AdaptiveManifest; dash?: AdaptiveManifest }> {
    await this.ensureTempDir();
    
    const targetFormats = options.targetFormats || ['hls', 'dash'];
    const qualities = options.qualities || ['360p', '480p', '720p'];
    
    console.log(`Processing video ${videoId} for adaptive streaming...`);
    console.log(`Target formats: ${targetFormats.join(', ')}`);
    console.log(`Quality levels: ${qualities.join(', ')}`);

    const results: { hls?: AdaptiveManifest; dash?: AdaptiveManifest } = {};

    // Download source video to temp directory
    const tempVideoPath = path.join(this.tempDir, `${videoId}-source.webm`);
    await this.downloadSourceVideo(sourceVideoPath, tempVideoPath);

    try {
      // Generate HLS if requested
      if (targetFormats.includes('hls')) {
        console.log('Generating HLS streams...');
        results.hls = await this.generateHLS(tempVideoPath, videoId, qualities);
      }

      // Generate DASH if requested
      if (targetFormats.includes('dash')) {
        console.log('Generating DASH streams...');
        results.dash = await this.generateDASH(tempVideoPath, videoId, qualities);
      }

      console.log(`Video processing completed for ${videoId}`);
      return results;

    } finally {
      // Cleanup temp files
      await this.cleanupTempFiles(videoId);
    }
  }

  private async downloadSourceVideo(sourcePath: string, destPath: string): Promise<void> {
    // In a real implementation, download from object storage
    // For now, simulate this step
    console.log(`Downloading source video from ${sourcePath} to ${destPath}`);
    
    // Create a placeholder file for development
    await fs.writeFile(destPath, 'placeholder-video-data');
  }

  private async generateHLS(
    sourceVideoPath: string,
    videoId: string,
    qualities: VideoQuality[]
  ): Promise<AdaptiveManifest> {
    const hlsDir = path.join(this.tempDir, `${videoId}-hls`);
    await fs.mkdir(hlsDir, { recursive: true });

    const qualityPlaylists: Array<{
      quality: VideoQuality;
      bandwidth: number;
      playlist: string;
    }> = [];

    // Generate quality-specific streams
    for (const quality of qualities) {
      if (quality === 'auto') continue;
      
      const config = QUALITY_CONFIGS[quality];
      if (!config) continue;

      const qualityDir = path.join(hlsDir, quality);
      await fs.mkdir(qualityDir, { recursive: true });

      console.log(`Generating HLS ${quality} stream...`);
      
      // In production, use FFmpeg to generate actual HLS streams
      // ffmpeg -i input.webm -c:v libx264 -b:v 800k -s 640x360 -f hls -hls_time 10 -hls_playlist_type vod output.m3u8
      const playlistContent = this.generateHLSPlaylist(quality, 60); // 60 second duration
      const playlistPath = path.join(qualityDir, 'playlist.m3u8');
      await fs.writeFile(playlistPath, playlistContent);

      // Upload quality playlist to object storage
      const objectPath = `videos/${videoId}/hls/${quality}/playlist.m3u8`;
      await this.uploadToStorage(playlistPath, objectPath);

      qualityPlaylists.push({
        quality,
        bandwidth: config.bandwidth,
        playlist: objectPath,
      });
    }

    // Generate master playlist
    const masterPlaylist = generateHLSMasterPlaylist(qualities);
    const masterPath = path.join(hlsDir, 'master.m3u8');
    await fs.writeFile(masterPath, masterPlaylist);

    // Upload master playlist
    const masterObjectPath = `videos/${videoId}/hls/master.m3u8`;
    await this.uploadToStorage(masterPath, masterObjectPath);

    return {
      type: 'hls',
      masterPlaylist: masterObjectPath,
      qualities: qualityPlaylists,
    };
  }

  private async generateDASH(
    sourceVideoPath: string,
    videoId: string,
    qualities: VideoQuality[]
  ): Promise<AdaptiveManifest> {
    const dashDir = path.join(this.tempDir, `${videoId}-dash`);
    await fs.mkdir(dashDir, { recursive: true });

    // Generate DASH manifest
    const manifest = generateDASHManifest(qualities);
    const manifestPath = path.join(dashDir, 'manifest.mpd');
    await fs.writeFile(manifestPath, manifest);

    // Upload manifest to object storage
    const manifestObjectPath = `videos/${videoId}/dash/manifest.mpd`;
    await this.uploadToStorage(manifestPath, manifestObjectPath);

    // Generate quality representations
    const representations: Array<{
      quality: VideoQuality;
      bandwidth: number;
      representation: string;
    }> = [];

    for (const quality of qualities) {
      if (quality === 'auto') continue;
      
      const config = QUALITY_CONFIGS[quality];
      if (!config) continue;

      console.log(`Generating DASH ${quality} representation...`);
      
      const qualityDir = path.join(dashDir, quality);
      await fs.mkdir(qualityDir, { recursive: true });

      // In production, use FFmpeg/MP4Box to generate DASH segments
      // Create placeholder init and segment files
      const initPath = path.join(qualityDir, 'init.mp4');
      await fs.writeFile(initPath, 'dash-init-data');
      await this.uploadToStorage(initPath, `videos/${videoId}/dash/${quality}/init.mp4`);

      representations.push({
        quality,
        bandwidth: config.bandwidth,
        representation: `videos/${videoId}/dash/${quality}/`,
      });
    }

    return {
      type: 'dash',
      manifest: manifestObjectPath,
      qualities: representations,
    };
  }

  private generateHLSPlaylist(quality: VideoQuality, durationSeconds: number): string {
    const segmentDuration = 10; // 10 second segments
    const segmentCount = Math.ceil(durationSeconds / segmentDuration);
    
    let playlist = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-PLAYLIST-TYPE:VOD\n\n';
    
    for (let i = 0; i < segmentCount; i++) {
      const actualDuration = i === segmentCount - 1 ? 
        durationSeconds - (i * segmentDuration) : segmentDuration;
      playlist += `#EXTINF:${actualDuration.toFixed(6)},\nsegment${i.toString().padStart(3, '0')}.ts\n`;
    }
    
    playlist += '#EXT-X-ENDLIST\n';
    return playlist;
  }

  private async uploadToStorage(localPath: string, objectPath: string): Promise<void> {
    // In production, upload to actual object storage
    console.log(`Uploading ${localPath} to ${objectPath}`);
    // Simulate upload success
  }

  private async cleanupTempFiles(videoId: string): Promise<void> {
    const patterns = [
      `${videoId}-source.*`,
      `${videoId}-hls`,
      `${videoId}-dash`,
    ];

    for (const pattern of patterns) {
      const fullPath = path.join(this.tempDir, pattern);
      try {
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true });
        } else {
          await fs.unlink(fullPath);
        }
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Cleanup warning for ${fullPath}:`, error);
      }
    }
  }

  /**
   * Check if FFmpeg is available for video processing
   */
  async checkFFmpegAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', ['-version'], { stdio: 'pipe' });
      
      ffmpeg.on('close', (code) => {
        resolve(code === 0);
      });
      
      ffmpeg.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Get video metadata using FFprobe
   */
  async getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    bitrate: number;
  } | null> {
    return new Promise((resolve) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        videoPath
      ], { stdio: 'pipe' });
      
      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ffprobe.on('close', (code) => {
        if (code !== 0) {
          resolve(null);
          return;
        }
        
        try {
          const metadata = JSON.parse(output);
          const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
          
          if (!videoStream) {
            resolve(null);
            return;
          }
          
          resolve({
            duration: parseFloat(metadata.format.duration) || 0,
            width: videoStream.width || 0,
            height: videoStream.height || 0,
            bitrate: parseInt(metadata.format.bit_rate) || 0,
          });
        } catch (error) {
          console.error('Error parsing FFprobe output:', error);
          resolve(null);
        }
      });
      
      ffprobe.on('error', () => {
        resolve(null);
      });
    });
  }
}

// Singleton instance
export const videoProcessor = new VideoProcessor();