import { useEffect, useRef, useState } from "react";

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

  // Vimeo embed URL optimized to show thumbnail/preview before playing
  const vimeoSrc = `https://player.vimeo.com/video/${vimeoId}?controls=1&autoplay=${autoplay ? 1 : 0}&muted=0&loop=0&title=0&byline=0&portrait=0&responsive=1&dnt=1`;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

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
          if (data.data && data.data.percent !== undefined) {
            onProgress?.(data.data.percent * 100);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onProgress, onEnd, onStart]);

  return (
    <div className={`relative bg-black overflow-hidden ${className}`} style={{ aspectRatio: '16/9' }}>
      {/* Vimeo iframe with thumbnail visible by default */}
      <iframe
        ref={iframeRef}
        src={vimeoSrc}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Workout Video"
        loading="eager"
      />
    </div>
  );
}