import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
}

export const VideoPlayer = ({ src, currentTime, onTimeUpdate, onDurationChange }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const mediaElement = videoRef.current || audioRef.current;
    if (!mediaElement) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(mediaElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      onDurationChange(mediaElement.duration);
    };

    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate, onDurationChange]);

  // Determine if it's a video or audio file
  const isVideo = src && (src.includes('video') || src.match(/\.(mp4|webm|ogg|mov|avi)$/i));

  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      {isVideo ? (
        <video
          ref={videoRef}
          src={src}
          controls
          className="max-w-full max-h-full"
          preload="metadata"
        />
      ) : (
        <div className="text-center text-white">
          <audio
            ref={audioRef}
            src={src}
            controls
            className="mb-4"
            preload="metadata"
          />
          <div className="text-lg font-medium">Audio File</div>
          <div className="text-sm text-gray-300 mt-2">Audio waveform will be displayed in the timeline below</div>
        </div>
      )}
    </div>
  );
};