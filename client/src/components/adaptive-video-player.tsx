import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2 } from 'lucide-react';
import { detectPlayerSupport, type DeviceCapabilities, type VideoQuality, type AdaptiveManifest } from '@shared/video-formats';

// Types for HLS.js and DASH.js (will be loaded dynamically)
declare global {
  interface Window {
    Hls?: any;
    dashjs?: any;
  }
}

interface AdaptiveVideoPlayerProps {
  src: string;
  hlsManifest?: AdaptiveManifest;
  dashManifest?: AdaptiveManifest;
  poster?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: string) => void;
  onQualityChange?: (quality: VideoQuality) => void;
  showControls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  'data-testid'?: string;
}

export function AdaptiveVideoPlayer({
  src,
  hlsManifest,
  dashManifest,
  poster,
  className = "",
  onPlay,
  onPause,
  onError,
  onQualityChange,
  showControls = true,
  autoplay = false,
  muted = false,
  'data-testid': testId
}: AdaptiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const dashPlayerRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>('auto');
  const [availableQualities, setAvailableQualities] = useState<VideoQuality[]>(['auto']);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect device capabilities on mount
  useEffect(() => {
    const caps = detectPlayerSupport();
    setCapabilities(caps);
    console.log('Device capabilities:', caps);
  }, []);

  // Load required streaming libraries
  const loadStreamingLibraries = useCallback(async () => {
    const caps = capabilities;
    if (!caps) return;

    // Load HLS.js if needed
    if (caps.preferredFormat === 'hls' && !caps.isMobile && !window.Hls) {
      try {
        console.log('Loading HLS.js...');
        const hlsModule = await import('hls.js');
        window.Hls = hlsModule.default;
      } catch (error) {
        console.error('Failed to load HLS.js:', error);
      }
    }

    // Load DASH.js if needed  
    if (caps.preferredFormat === 'dash' && !window.dashjs) {
      try {
        console.log('Loading DASH.js...');
        const dashModule = await import('dashjs');
        window.dashjs = dashModule;
      } catch (error) {
        console.error('Failed to load DASH.js:', error);
      }
    }
  }, [capabilities]);

  // Initialize video player with appropriate streaming format
  useEffect(() => {
    if (!videoRef.current || !capabilities) return;

    const setupPlayer = async () => {
      setIsLoading(true);
      await loadStreamingLibraries();

      const video = videoRef.current!;
      const { preferredFormat, isMobile } = capabilities;

      try {
        // Cleanup previous players
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        if (dashPlayerRef.current) {
          dashPlayerRef.current.reset();
          dashPlayerRef.current = null;
        }

        // Choose best streaming format
        if (preferredFormat === 'hls' && hlsManifest) {
          await setupHLSPlayer(video, hlsManifest);
        } else if (preferredFormat === 'dash' && dashManifest) {
          await setupDASHPlayer(video, dashManifest);
        } else {
          // Fallback to progressive MP4
          console.log('Using progressive MP4 fallback');
          video.src = src;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Player setup error:', error);
        setPlayerError('Failed to initialize video player');
        setIsLoading(false);
        onError?.('Failed to initialize video player');
      }
    };

    setupPlayer();

    return () => {
      // Cleanup on unmount
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (dashPlayerRef.current) {
        dashPlayerRef.current.reset();
      }
    };
  }, [src, hlsManifest, dashManifest, capabilities]);

  const setupHLSPlayer = async (video: HTMLVideoElement, manifest: AdaptiveManifest) => {
    if (manifest.type !== 'hls') return;

    const isMobile = capabilities?.isMobile;
    
    if (isMobile && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support on iOS
      console.log('Using native HLS on iOS');
      video.src = `/api/videos/stream/${manifest.masterPlaylist}`;
      setAvailableQualities(['auto', ...manifest.qualities.map(q => q.quality)]);
    } else if (window.Hls && window.Hls.isSupported()) {
      // HLS.js for other browsers
      console.log('Using HLS.js');
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(`/api/videos/stream/${manifest.masterPlaylist}`);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((_: any, index: number) => 
          manifest.qualities[index]?.quality || 'auto'
        );
        setAvailableQualities(['auto', ...levels]);
      });

      hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          setPlayerError('HLS playback error');
          onError?.('HLS playback error');
        }
      });

      hlsRef.current = hls;
    } else {
      throw new Error('HLS not supported');
    }
  };

  const setupDASHPlayer = async (video: HTMLVideoElement, manifest: AdaptiveManifest) => {
    if (manifest.type !== 'dash' || !window.dashjs) return;

    console.log('Using DASH.js');
    const player = window.dashjs.MediaPlayer().create();
    
    player.initialize(video, `/api/videos/stream/${manifest.manifest}`, autoplay);
    
    player.on('error', (e: any) => {
      console.error('DASH Error:', e);
      setPlayerError('DASH playback error');
      onError?.('DASH playback error');
    });

    player.on('streamInitialized', () => {
      const qualities = manifest.qualities.map(q => q.quality);
      setAvailableQualities(['auto', ...qualities]);
    });

    dashPlayerRef.current = player;
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const updateBuffer = () => {
      if (video.buffered.length > 0) {
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleError = () => {
      const error = video.error;
      console.error('Video error:', error);
      setPlayerError('Video playback failed');
      onError?.('Video playback failed');
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('progress', updateBuffer);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('progress', updateBuffer);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [onPlay, onPause, onError]);

  // Control handlers
  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const changeQuality = (quality: VideoQuality) => {
    setCurrentQuality(quality);
    onQualityChange?.(quality);

    // Update player quality
    if (hlsRef.current) {
      if (quality === 'auto') {
        hlsRef.current.currentLevel = -1; // Auto
      } else {
        const levelIndex = hlsRef.current.levels.findIndex((level: any) => 
          level.height.toString().includes(quality.replace('p', ''))
        );
        if (levelIndex >= 0) {
          hlsRef.current.currentLevel = levelIndex;
        }
      }
    } else if (dashPlayerRef.current) {
      if (quality === 'auto') {
        dashPlayerRef.current.setAutoSwitchQuality(true);
      } else {
        dashPlayerRef.current.setAutoSwitchQuality(false);
        // Set specific quality for DASH
      }
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (playerError) {
    return (
      <div className={`relative bg-black flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <p className="mb-2">Video playback error</p>
          <p className="text-sm text-gray-400">{playerError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`} data-testid={testId}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        playsInline
        webkit-playsinline="true"
        crossOrigin="anonymous"
        muted={muted}
        autoPlay={autoplay}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading video...</span>
          </div>
        </div>
      )}

      {showControls && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 1}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePlayPause}
                className="text-white hover:text-white hover:bg-white/20"
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Quality Selector */}
              <Select value={currentQuality} onValueChange={changeQuality}>
                <SelectTrigger className="w-20 h-8 text-white border-white/20 bg-black/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableQualities.map(quality => (
                    <SelectItem key={quality} value={quality}>
                      {quality === 'auto' ? 'Auto' : quality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}