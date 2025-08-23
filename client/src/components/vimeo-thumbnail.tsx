import { useState, useEffect } from "react";
import { Play } from "lucide-react";

interface VimeoThumbnailProps {
  vimeoId: string;
  alt: string;
  className?: string;
  showOverlay?: boolean;
  workoutTitle?: string;
  duration?: number;
}

export default function VimeoThumbnail({ 
  vimeoId, 
  alt, 
  className = "", 
  showOverlay = true,
  workoutTitle,
  duration 
}: VimeoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch Vimeo thumbnail using their API
    const fetchVimeoThumbnail = async () => {
      try {
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`);
        const data = await response.json();
        if (data.thumbnail_url) {
          setThumbnailUrl(data.thumbnail_url);
        }
      } catch (error) {
        console.warn("Failed to fetch Vimeo thumbnail, using fallback");
        // Fallback to Vimeo's direct thumbnail URL pattern
        setThumbnailUrl(`https://vumbnail.com/${vimeoId}.jpg`);
      } finally {
        setIsLoading(false);
      }
    };

    if (vimeoId) {
      fetchVimeoThumbnail();
    }
  }, [vimeoId]);

  if (isLoading) {
    return (
      <div className={`bg-slate-700 animate-pulse flex items-center justify-center ${className}`}>
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:00`;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Vimeo thumbnail image */}
      <img 
        src={thumbnailUrl || `https://vumbnail.com/${vimeoId}.jpg`}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Video overlay - matches your screenshot style */}
      {showOverlay && (
        <>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Center play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary transition-all">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>

          {/* Bottom overlay with workout info - matches screenshot */}
          {(workoutTitle || duration) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
              <div className="p-4 flex items-center justify-between">
                {workoutTitle && (
                  <div className="flex items-center space-x-2">
                    <div className="text-orange-500 font-bold text-sm">X3</div>
                    <div className="text-white font-bold text-lg tracking-wider uppercase">
                      {workoutTitle}
                    </div>
                  </div>
                )}
                {duration && (
                  <div className="text-white font-bold text-xl">
                    {formatDuration(duration)}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}