import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize 
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    
    // Listen for messages from Vimeo player
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;
      
      const data = event.data;
      
      switch (data.event) {
        case 'ready':
          // Player is ready
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'play' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'pause' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'ended' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'timeupdate' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'loaded' }, '*');
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
          setCurrentTime(data.data.seconds);
          onProgress?.(data.data.percent * 100);
          break;
        case 'loaded':
          setDuration(data.data.duration);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onProgress, onEnd, onStart]);

  const play = () => {
    iframeRef.current?.contentWindow?.postMessage({ method: 'play' }, '*');
  };

  const pause = () => {
    iframeRef.current?.contentWindow?.postMessage({ method: 'pause' }, '*');
  };

  const toggleMute = () => {
    const method = isMuted ? 'setVolume' : 'setVolume';
    const value = isMuted ? 1 : 0;
    iframeRef.current?.contentWindow?.postMessage({ method, value }, '*');
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const vimeoSrc = `https://player.vimeo.com/video/${vimeoId}?api=1&player_id=vimeo-player-${vimeoId}&autoplay=${autoplay ? 1 : 0}&muted=${autoplay ? 1 : 0}&responsive=1`;

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <iframe
        ref={iframeRef}
        id={`vimeo-player-${vimeoId}`}
        src={vimeoSrc}
        className="w-full h-full aspect-video"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Workout Video"
      />
      
      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={isPlaying ? pause : play}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex-1 text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}