import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
}

export default function VideoPlayer({
  src,
  poster,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - currentTime) > 1) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      onTimeUpdate(Math.floor(video.currentTime));
    }
  };

  const handlePlay = () => {
    onPlay();
  };

  const handlePause = () => {
    onPause();
  };

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      poster={poster}
      onTimeUpdate={handleTimeUpdate}
      onPlay={handlePlay}
      onPause={handlePause}
      playsInline
      controls={false}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}
