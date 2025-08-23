import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward
} from "lucide-react";

interface VimeoPlayerProps {
  vimeoId: string;
  onProgress?: (progress: number) => void;
  onEnd?: () => void;
  onStart?: () => void;
  autoplay?: boolean;
  className?: string;
}

export default function VimeoPlayer({ 
  vimeoId, 
  onProgress, 
  onEnd, 
  onStart, 
  autoplay = false,
  className = ""
}: VimeoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Build the Vimeo embed URL without default controls
  const vimeoSrc = `https://player.vimeo.com/video/${vimeoId}?api=1&player_id=vimeo-player-${vimeoId}&autoplay=${autoplay ? 1 : 0}&controls=0&title=0&byline=0&portrait=0&responsive=1`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Listen for messages from Vimeo player
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;
      
      const data = event.data;
      
      switch (data.event) {
        case 'ready':
          setIsReady(true);
          // Register for events
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'play' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'pause' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'ended' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'timeupdate' }, '*');
          iframe.contentWindow?.postMessage({ method: 'getDuration' }, '*');
          break;
        case 'play':
          setIsPlaying(true);
          onStart?.();
          break;
        case 'pause':
          setIsPlaying(false);
          break;
        case 'ended':
          setIsPlaying(false);
          onEnd?.();
          break;
        case 'timeupdate':
          if (data.data) {
            const seconds = data.data.seconds || 0;
            const percent = data.data.percent || 0;
            setCurrentTime(seconds);
            onProgress?.(percent * 100);
          }
          break;
      }
      
      // Handle method responses
      if (data.method === 'getDuration' && data.value) {
        setDuration(data.value);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onProgress, onEnd, onStart]);

  // Auto-hide controls when playing
  useEffect(() => {
    if (isPlaying && showControls) {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying, showControls]);

  // Control functions
  const sendCommand = (method: string, value?: any) => {
    if (!iframeRef.current || !isReady) return;
    const message = value !== undefined ? { method, value } : { method };
    iframeRef.current.contentWindow?.postMessage(message, '*');
  };

  const togglePlay = () => {
    sendCommand(isPlaying ? 'pause' : 'play');
  };

  const seekTo = (seconds: number) => {
    sendCommand('setCurrentTime', seconds);
  };

  const setVolumeLevel = (level: number) => {
    sendCommand('setVolume', level);
    setVolume(level);
    setIsMuted(level === 0);
  };

  const toggleMute = () => {
    const newVolume = isMuted ? volume : 0;
    setVolumeLevel(newVolume);
  };

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seekTo(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Vimeo iframe */}
      <iframe
        ref={iframeRef}
        id={`vimeo-player-${vimeoId}`}
        src={vimeoSrc}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Workout Video"
      />
      
      {/* Controls overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ pointerEvents: showControls ? 'auto' : 'none' }}
      >
        {/* Center play/pause button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 bg-black/50 hover:bg-black/70 rounded-full border border-white/20"
            onClick={togglePlay}
            data-testid="button-center-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </Button>
        </div>

        {/* Bottom controls bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
          <div className="p-4 space-y-4">
            {/* Progress bar */}
            <div className="flex items-center space-x-3">
              <span className="text-white text-sm font-mono min-w-[45px]">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || 1}
                  step={1}
                  className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
                  onValueChange={(value) => seekTo(value[0])}
                  data-testid="slider-progress"
                />
              </div>
              <span className="text-white text-sm font-mono min-w-[45px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Skip back */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => skipTime(-10)}
                  data-testid="button-skip-back"
                >
                  <SkipBack className="w-4 h-4 mr-1" />
                  <span className="text-xs">10s</span>
                </Button>
                
                {/* Play/pause */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={togglePlay}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
                
                {/* Skip forward */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => skipTime(10)}
                  data-testid="button-skip-forward"
                >
                  <span className="text-xs">10s</span>
                  <SkipForward className="w-4 h-4 ml-1" />
                </Button>

                {/* Restart */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 ml-2"
                  onClick={() => seekTo(0)}
                  data-testid="button-restart"
                >
                  <span className="text-xs">Restart</span>
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                {/* Volume controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={toggleMute}
                    data-testid="button-mute"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
                      onValueChange={(value) => setVolumeLevel(value[0])}
                      data-testid="slider-volume"
                    />
                  </div>
                </div>
                
                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                  data-testid="button-fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}