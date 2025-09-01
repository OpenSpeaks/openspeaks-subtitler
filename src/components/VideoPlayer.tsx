import { useRef, useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
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
      
      // Check MIME type from blob URL
      try {
        const response = await fetch(src, { method: 'HEAD' });
        const contentType = response.headers.get('content-type') || '';
        setIsVideo(contentType.startsWith('video/'));
      } catch {
        // Fallback to false for audio
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

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative group">
      {isVideo ? (
        <video
          ref={videoRef}
          src={src}
          className="max-w-full max-h-full cursor-pointer"
          preload="metadata"
          onClick={handleMediaClick}
        />
      ) : (
        <div className="text-center text-white cursor-pointer" onClick={handleMediaClick}>
          <div className="mb-4 flex items-center justify-center">
            <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <Button
                variant="secondary"
                size="lg"
                className="w-16 h-16 rounded-full bg-primary hover:bg-primary/80"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </Button>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={src}
            preload="metadata"
            className="hidden"
          />
          <div className="text-lg font-medium">Audio File</div>
          <div className="text-sm text-gray-300 mt-2">Click to play/pause • Audio waveform shown in timeline</div>
        </div>
      )}
      
      {/* Play/Pause overlay for video */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Button
            variant="secondary"
            size="lg"
            className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>
        </div>
      )}
    </div>
  );
};