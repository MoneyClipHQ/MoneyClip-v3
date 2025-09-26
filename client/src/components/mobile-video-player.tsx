import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Captions,
  CaptionsOff,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onError?: (error: string) => void;
  onSpeedChange?: (speed: number) => void;
  onSeek?: (time: number) => void;
  showControls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  captionsEnabled?: boolean;
  captionsUrl?: string;
  'data-testid'?: string;
}

export interface MobileVideoPlayerRef {
  play: () => Promise<void>;
  pause: () => void;
  getVideoElement: () => HTMLVideoElement | null;
  getCurrentTime: () => number;
  getDuration: () => number;
  setCurrentTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  isPlaying: () => boolean;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const MobileVideoPlayer = forwardRef<MobileVideoPlayerRef, MobileVideoPlayerProps>(function MobileVideoPlayer({
  src,
  poster,
  className = "",
  onPlay,
  onPause,
  onError,
  onSpeedChange,
  onSeek,
  showControls = true,
  autoplay = false,
  muted = false,
  captionsEnabled = false,
  captionsUrl,
  'data-testid': testId
}, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(captionsEnabled);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      // Additional mobile detection methods
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const smallScreen = window.innerWidth <= 768;
      const isMobileDevice = mobile || (hasTouch && smallScreen);
      
      console.log('Mobile detection:', {
        userAgent,
        mobile,
        hasTouch,
        smallScreen,
        screenWidth: window.innerWidth,
        finalIsMobile: isMobileDevice
      });
      
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    
    // Re-check on window resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide controls on mobile after inactivity
  useEffect(() => {
    if (!isMobile || !showControls) return;
    
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setControlsVisible(true);
      if (isPlaying) {
        timeout = setTimeout(() => setControlsVisible(false), 3000);
      }
    };
    
    const handleUserActivity = () => resetTimeout();
    
    resetTimeout();
    
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [isPlaying, isMobile, showControls]);

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

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);

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
      let errorMessage = "Video playback failed. Please try refreshing the page.";
      
      console.error('Video error details:', {
        error,
        errorCode: error?.code,
        errorMessage: error?.message,
        videoSrc: src,
        isMobile,
        userAgent: navigator.userAgent
      });
      
      if (error) {
        if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          if (isMobile) {
            errorMessage = "Video format not supported on your mobile device. Please try opening this link on a desktop computer or different browser.";
          } else {
            errorMessage = "Video format not supported. Please try a different browser like Chrome or Firefox.";
          }
        } else if (error.code === MediaError.MEDIA_ERR_DECODE) {
          if (isMobile) {
            errorMessage = "Video playback error on mobile device. Please try opening this link on a desktop computer.";
          } else {
            errorMessage = "Video decoding error. Please try refreshing the page or using a different browser.";
          }
        } else if (error.code === MediaError.MEDIA_ERR_NETWORK) {
          errorMessage = "Network error loading video. Please check your internet connection and try again.";
        } else if (error.code === MediaError.MEDIA_ERR_ABORTED) {
          errorMessage = "Video loading was interrupted. Please try again.";
        }
      }
      
      setPlayerError(errorMessage);
      onError?.(errorMessage);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('progress', updateBuffer);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('progress', updateBuffer);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onPlay, onPause, onError, isMobile]);

  // Control handlers
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      console.error('Video element not found when trying to toggle play/pause');
      return;
    }

    console.log('Attempting to toggle play/pause:', {
      isPlaying,
      videoCurrentTime: video.currentTime,
      videoDuration: video.duration,
      videoReadyState: video.readyState,
      isMobile
    });

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(error => {
        console.error('Error playing video:', error);
        setPlayerError(`Unable to play video: ${error.message}`);
      });
    }
  }, [isPlaying, isMobile]);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = value[0];
    video.currentTime = newTime;
    setCurrentTime(newTime);
    onSeek?.(newTime);
  }, [onSeek]);

  const skipTime = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    onSeek?.(newTime);
  }, [currentTime, duration, onSeek]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = value[0];
    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Expose player controls through ref
  useImperativeHandle(ref, () => ({
    play: async () => {
      if (videoRef.current) {
        await videoRef.current.play();
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    },
    getVideoElement: () => videoRef.current,
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    setCurrentTime: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    setPlaybackRate: (rate: number) => {
      if (videoRef.current) {
        videoRef.current.playbackRate = rate;
        setPlaybackSpeed(rate);
      }
    },
    setVolume: (vol: number) => {
      if (videoRef.current) {
        videoRef.current.volume = vol;
        setVolume(vol);
        setIsMuted(vol === 0);
      }
    },
    toggleMute: () => {
      toggleMute();
    },
    isPlaying: () => isPlaying,
  }), [currentTime, duration, isPlaying, volume, toggleMute]);

  const changePlaybackSpeed = useCallback((speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    setPlaybackSpeed(speed);
    video.playbackRate = speed;
    onSpeedChange?.(speed);
  }, [onSpeedChange]);

  const toggleCaptions = useCallback(() => {
    const newShowCaptions = !showCaptions;
    setShowCaptions(newShowCaptions);
    
    const video = videoRef.current;
    if (video) {
      const tracks = video.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles') {
          tracks[i].mode = newShowCaptions ? 'showing' : 'hidden';
        }
      }
    }
  }, [showCaptions]);

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyC':
          e.preventDefault();
          toggleCaptions();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skipTime, handleVolumeChange, volume, toggleMute, toggleFullscreen, toggleCaptions]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (playerError) {
    return (
      <div className={cn("relative bg-black flex items-center justify-center text-white", className)}>
        <div className="text-center p-8">
          <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="mb-2 font-medium">Video playback error</p>
          <p className="text-sm text-gray-400 mb-4">{playerError}</p>
          <Button
            onClick={() => {
              setPlayerError(null);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn("relative group w-full h-full", className)} 
      data-testid={testId}
      onClick={() => isMobile && togglePlayPause()}
      style={{ minHeight: '200px' }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain bg-black"
        playsInline
        webkit-playsinline="true"
        x-webkit-airplay="allow"
        crossOrigin="anonymous"
        muted={muted}
        autoPlay={autoplay}
        controls={false}
        preload="metadata"
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      >
        {captionsUrl && (
          <track
            kind="captions"
            src={captionsUrl}
            srcLang="en"
            label="English"
            default={showCaptions}
          />
        )}
      </video>

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Mobile Play Button Overlay */}
      {isMobile && !isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Button
            size="lg"
            variant="ghost"
            onClick={togglePlayPause}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-6"
            data-testid="mobile-play-button"
          >
            <Play className="h-12 w-12" />
          </Button>
        </div>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black/90 text-white text-xs p-2 rounded z-20 max-w-xs">
          <div>Mobile: {isMobile ? 'YES' : 'NO'}</div>
          <div>Playing: {isPlaying ? 'YES' : 'NO'}</div>
          <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
          <div>Controls: {controlsVisible ? 'YES' : 'NO'}</div>
          <div>Has Src: {src ? 'YES' : 'NO'}</div>
          <div>Duration: {duration.toFixed(1)}s</div>
          {playerError && <div className="text-red-300">Error: {playerError.substring(0, 50)}</div>}
        </div>
      )}

      {/* Desktop Controls */}
      {showControls && !isMobile && (
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

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePlayPause}
                className="text-white hover:text-white hover:bg-white/20"
                data-testid="desktop-play-pause"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => skipTime(-10)}
                className="text-white hover:text-white hover:bg-white/20"
                data-testid="skip-back"
              >
                <SkipBack className="h-4 w-4" />
                <span className="text-xs ml-1">10s</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => skipTime(10)}
                className="text-white hover:text-white hover:bg-white/20"
                data-testid="skip-forward"
              >
                <SkipForward className="h-4 w-4" />
                <span className="text-xs ml-1">10s</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:text-white hover:bg-white/20"
                  data-testid="volume-toggle"
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
              {/* Speed Control */}
              <Select value={playbackSpeed.toString()} onValueChange={(value) => changePlaybackSpeed(parseFloat(value))}>
                <SelectTrigger className="w-16 h-8 text-white border-white/20 bg-black/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAYBACK_SPEEDS.map(speed => (
                    <SelectItem key={speed} value={speed.toString()}>
                      {speed}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Captions Toggle */}
              {captionsUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleCaptions}
                  className="text-white hover:text-white hover:bg-white/20"
                  data-testid="captions-toggle"
                >
                  {showCaptions ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                className="text-white hover:text-white hover:bg-white/20"
                data-testid="fullscreen-toggle"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      {showControls && isMobile && controlsVisible && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-10">
          {/* Progress Bar */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 1}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer touch-manipulation"
            />
            <div className="flex justify-between text-xs text-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Mobile Control Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePlayPause}
                className="text-white hover:text-white hover:bg-white/20 p-3"
                data-testid="mobile-play-pause"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => skipTime(-10)}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => skipTime(10)}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {captionsUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleCaptions}
                  className="text-white hover:text-white hover:bg-white/20"
                >
                  {showCaptions ? <Captions className="h-4 w-4" /> : <CaptionsOff className="h-4 w-4" />}
                </Button>
              )}

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
});

MobileVideoPlayer.displayName = 'MobileVideoPlayer';