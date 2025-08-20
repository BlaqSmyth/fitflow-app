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
          break;
        case 'play':
          onStart?.();
          break;
        case 'pause':
          // Handle pause if needed
          break;
        case 'ended':
          onEnd?.();
          break;
        case 'timeupdate':
          if (data.data && data.data.percent !== undefined) {
            onProgress?.(data.data.percent * 100);
          }
          break;
        case 'loaded':
          // Video metadata loaded
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onProgress, onEnd, onStart]);

  // Build the Vimeo embed URL with proper parameters
  const vimeoSrc = `https://player.vimeo.com/video/${vimeoId}?api=1&player_id=vimeo-player-${vimeoId}&autoplay=${autoplay ? 1 : 0}&autopause=0&controls=1&title=0&byline=0&portrait=0&responsive=1`;

  return (
    <div className={`relative bg-black overflow-hidden ${className}`}>
      <iframe
        ref={iframeRef}
        id={`vimeo-player-${vimeoId}`}
        src={vimeoSrc}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title="Workout Video"
        style={{ aspectRatio: '16/9' }}
      />
    </div>
  );
}