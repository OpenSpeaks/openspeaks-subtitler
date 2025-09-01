import { useRef, useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  src: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onSeek?: (time: number) => void;
}

export const VideoPlayer = ({ src, currentTime, onTimeUpdate, onDurationChange, onSeek }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  useEffect(() => {
    // Better video detection
    const checkIsVideo = async () => {
      if (!src) return;
      
      // Check file extension first
      const videoExtensions = /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i;
      const audioExtensions = /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i;
      
      if (videoExtensions.test(src)) {
        setIsVideo(true);
        return;
      }
      
      if (audioExtensions.test(src)) {
        setIsVideo(false);
        return;
      }
      
      // For blob URLs, try to load as video first
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      try {
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            // If video has width and height, it's a video
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              setIsVideo(true);
            } else {
              setIsVideo(false);
            }
            resolve(null);
          };
          video.onerror = () => {
            setIsVideo(false);
            resolve(null);
          };
          video.src = src;
        });
      } catch {
        setIsVideo(false);
      }
    };
    
    checkIsVideo();
  }, [src]);

  useEffect(() => {
    const mediaElement = videoRef.current || audioRef.current;
    if (!mediaElement) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(mediaElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      onDurationChange(mediaElement.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('play', handlePlay);
    mediaElement.addEventListener('pause', handlePause);

    return () => {
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('play', handlePlay);
      mediaElement.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onDurationChange, isVideo]);

  // Sync external currentTime changes with media element
  useEffect(() => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement && Math.abs(mediaElement.currentTime - currentTime) > 0.5) {
      mediaElement.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlayPause = () => {
    const mediaElement = videoRef.current || audioRef.current;
    if (!mediaElement) return;

    if (isPlaying) {
      mediaElement.pause();
    } else {
      mediaElement.play();
    }
  };

  const handleMediaClick = () => {
    togglePlayPause();
  };

  const skipBackward = () => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement && onSeek) {
      const newTime = Math.max(0, mediaElement.currentTime - 10);
      onSeek(newTime);
    }
  };

  const skipForward = () => {
    const mediaElement = videoRef.current || audioRef.current;
    if (mediaElement && onSeek) {
      const newTime = Math.min(mediaElement.duration || 0, mediaElement.currentTime + 10);
      onSeek(newTime);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      {/* Control buttons overlay */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            skipBackward();
          }}
          className="bg-black/50 hover:bg-black/70 text-white border-white/20"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            skipForward();
          }}
          className="bg-black/50 hover:bg-black/70 text-white border-white/20"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Main video/audio area - clickable */}
      <div className="w-full h-full flex items-center justify-center group cursor-pointer" onClick={handleMediaClick}>
        {isVideo ? (
          <video
            ref={videoRef}
            src={src}
            className="max-w-full max-h-full"
            preload="metadata"
          />
        ) : (
          <div className="text-center text-white w-full h-full flex flex-col items-center justify-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
                  {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 ml-1 text-white" />}
                </div>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={src}
              preload="metadata"
              className="hidden"
            />
            <div className="text-lg font-medium">Audio File</div>
            <div className="text-sm text-gray-300 mt-2">Click anywhere to play/pause</div>
          </div>
        )}
        
        {/* Play/Pause overlay for video */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center">
              {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 ml-1 text-white" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};