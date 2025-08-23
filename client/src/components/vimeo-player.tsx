import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

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
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Simple Vimeo embed URL with minimal parameters
  const vimeoSrc = `https://player.vimeo.com/video/${vimeoId}?api=1&controls=0&autoplay=${autoplay ? 1 : 0}&title=0&byline=0&portrait=0`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://player.vimeo.com') return;
      
      const data = event.data;
      console.log('Vimeo message:', data);
      
      switch (data.event) {
        case 'ready':
          console.log('Vimeo player ready');
          setIsReady(true);
          // Subscribe to events
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'play' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'pause' }, '*');
          iframe.contentWindow?.postMessage({ method: 'addEventListener', value: 'ended' }, '*');
          break;
        case 'play':
          console.log('Video playing');
          setIsPlaying(true);
          onStart?.();
          break;
        case 'pause':
          console.log('Video paused');
          setIsPlaying(false);
          break;
        case 'ended':
          console.log('Video ended');
          setIsPlaying(false);
          onEnd?.();
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onProgress, onEnd, onStart]);

  const togglePlay = () => {
    if (!iframeRef.current || !isReady) {
      console.log('Player not ready yet');
      return;
    }
    
    const method = isPlaying ? 'pause' : 'play';
    console.log('Sending command:', method);
    iframeRef.current.contentWindow?.postMessage({ method }, '*');
  };

  return (
    <div 
      className={`relative bg-black overflow-hidden ${className}`}
      style={{ aspectRatio: '16/9' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(!isPlaying)}
    >
      {/* Vimeo iframe */}
      <iframe
        ref={iframeRef}
        src={vimeoSrc}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Workout Video"
      />
      
      {/* Simple overlay with just play/pause */}
      {showControls && (
        <div className="absolute inset-0 bg-black/20">
          {/* Large center play/pause button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={togglePlay}
              disabled={!isReady}
              className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-black border-4 border-white shadow-lg"
              data-testid="play-pause-button"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ml-1" />
              )}
            </Button>
          </div>
          
          {/* Simple bottom overlay showing status */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/80 text-white px-4 py-2 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {!isReady ? 'Loading...' : isPlaying ? 'Playing' : 'Paused'}
                </span>
                <Button
                  onClick={togglePlay}
                  disabled={!isReady}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}