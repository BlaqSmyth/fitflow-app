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
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    
    // Listen for messages from Vimeo player
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;
      
      const data = event.data;
      
      switch (data.event) {
        case 'ready':
          setIsReady(true);
          // Register for events we care about
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'play' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'pause' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'ended' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'timeupdate' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'loaded' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'volumechange' }, '*');
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
        case 'loaded':
          iframe.contentWindow?.postMessage({ method: 'getDuration' }, '*');
          break;
        case 'volumechange':
          if (data.data) {
            setVolume(data.data.volume || 1);
          }
          break;
      }
      
      // Handle method responses
      if (data.method === 'getDuration' && data.value) {
        setDuration(data.value);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onProgress, onEnd, onStart]);

  // Build the Vimeo embed URL with custom controls disabled
  const vimeoSrc = `https://player.vimeo.com/video/${vimeoId}?api=1&player_id=vimeo-player-${vimeoId}&autoplay=${autoplay ? 1 : 0}&autopause=0&controls=0&title=0&byline=0&portrait=0&responsive=1&background=0`;

  // Video control functions
  const togglePlay = () => {
    if (!iframeRef.current || !isReady) return;
    const method = isPlaying ? 'pause' : 'play';
    console.log('Sending command:', method);
    iframeRef.current.contentWindow?.postMessage({ method }, 'https://player.vimeo.com');
  };

  const seekTo = (seconds: number) => {
    if (!iframeRef.current || !isReady) return;
    iframeRef.current.contentWindow?.postMessage({ method: 'setCurrentTime', value: seconds }, 'https://player.vimeo.com');
  };

  const setVolumeLevel = (level: number) => {
    if (!iframeRef.current || !isReady) return;
    iframeRef.current.contentWindow?.postMessage({ method: 'setVolume', value: level }, 'https://player.vimeo.com');
    setVolume(level);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    setVolumeLevel(newMuted ? 0 : volume);
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

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seekTo(newTime);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  // Auto-hide controls when playing
  useEffect(() => {
    if (isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 4000);
      setControlsTimeout(timeout);
    } else {
      setShowControls(true);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    }
    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [isPlaying]);

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
      className={`relative bg-black overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <iframe
        ref={iframeRef}
        id={`vimeo-player-${vimeoId}`}
        src={vimeoSrc}
        className="w-full h-full pointer-events-none"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Workout Video"
        style={{ aspectRatio: '16/9' }}
      />
      
      {/* Custom Controls Overlay */}
      <div className="absolute inset-0">
        {/* Center Play/Pause Button - Always clickable area */}
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div 
            className={`transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="w-20 h-20 bg-black/60 hover:bg-black/80 rounded-full transition-all"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </Button>
          </div>
        </div>

        {/* Bottom Controls Bar - Always visible on hover */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="p-4 space-y-3">
            {/* Progress Bar */}
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
                />
              </div>
              <span className="text-white text-sm font-mono min-w-[45px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {/* Rewind 10s */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 px-2"
                  onClick={() => skipTime(-10)}
                >
                  <SkipBack className="w-4 h-4 mr-1" />
                  <span className="text-xs">10s</span>
                </Button>
                
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 mx-2"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </Button>
                
                {/* Fast Forward 10s */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 px-2"
                  onClick={() => skipTime(10)}
                >
                  <span className="text-xs">10s</span>
                  <SkipForward className="w-4 h-4 ml-1" />
                </Button>
                
                {/* Restart/Stop */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 px-2 ml-2"
                  onClick={() => seekTo(0)}
                >
                  <span className="text-xs">Restart</span>
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
                      onValueChange={(value) => {
                        const newVolume = value[0];
                        setIsMuted(newVolume === 0);
                        setVolumeLevel(newVolume);
                      }}
                    />
                  </div>
                </div>
                
                {/* Fullscreen Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5" />
                  ) : (
                    <Maximize className="w-5 h-5" />
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