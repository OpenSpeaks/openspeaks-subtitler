import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Play, Pause } from "lucide-react";

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface TimelineProps {
  subtitles: Subtitle[];
  duration: number;
  currentTime: number;
  onSubtitleSelect: (subtitle: Subtitle) => void;
  onSubtitleCreate: (startTime: number, endTime: number) => void;
  selectedSubtitle: Subtitle | null;
}

export const Timeline = ({ 
  subtitles, 
  duration, 
  currentTime, 
  onSubtitleSelect, 
  onSubtitleCreate,
  selectedSubtitle 
}: TimelineProps) => {
  const [viewStart, setViewStart] = useState(0);
  const [viewDuration, setViewDuration] = useState(15); // 15 seconds visible
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll timeline to follow current time
  useEffect(() => {
    if (currentTime < viewStart || currentTime > viewStart + viewDuration) {
      setViewStart(Math.max(0, currentTime - viewDuration / 2));
    }
  }, [currentTime, viewStart, viewDuration]);

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const timelineWidth = rect.width;
    const clickTime = viewStart + (clickX / timelineWidth) * viewDuration;
    
    // Find if clicked on existing subtitle
    const clickedSubtitle = subtitles.find(sub => 
      clickTime >= sub.startTime && clickTime <= sub.endTime
    );
    
    if (clickedSubtitle) {
      onSubtitleSelect(clickedSubtitle);
    }
  };

  const handleTimelineDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const timelineWidth = rect.width;
    const clickTime = viewStart + (clickX / timelineWidth) * viewDuration;
    
    // Create new subtitle (3 seconds long by default)
    const startTime = clickTime;
    const endTime = Math.min(clickTime + 3, duration);
    onSubtitleCreate(startTime, endTime);
  };

  const zoomIn = () => {
    setViewDuration(prev => Math.max(5, prev / 2));
  };

  const zoomOut = () => {
    setViewDuration(prev => Math.min(duration, prev * 2));
  };

  const generateTimeMarkers = () => {
    const markers = [];
    const step = viewDuration <= 5 ? 0.5 : viewDuration <= 15 ? 1 : 5;
    
    for (let time = Math.floor(viewStart / step) * step; time <= viewStart + viewDuration; time += step) {
      if (time >= 0 && time <= duration) {
        const position = ((time - viewStart) / viewDuration) * 100;
        markers.push(
          <div
            key={time}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${position}%` }}
          >
            <div className="w-px h-4 bg-timeline-grid"></div>
            <span className="text-xs text-muted-foreground mt-1">
              {Math.floor(time / 60)}:{(time % 60).toFixed(step < 1 ? 1 : 0).padStart(step < 1 ? 4 : 2, '0')}
            </span>
          </div>
        );
      }
    }
    return markers;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {viewDuration}s visible
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          Current: {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={timelineRef}
          className="h-full bg-timeline relative cursor-pointer select-none"
          onClick={handleTimelineClick}
          onDoubleClick={handleTimelineDoubleClick}
        >
          {/* Time markers */}
          <div className="absolute top-0 w-full h-8 border-b border-timeline-grid">
            {generateTimeMarkers()}
          </div>

          {/* Waveform placeholder */}
          <div className="absolute top-8 w-full h-16 bg-gradient-to-r from-waveform/20 to-waveform/10">
            <div className="w-full h-full bg-waveform/30 opacity-50" 
                 style={{
                   background: `repeating-linear-gradient(
                     90deg,
                     transparent,
                     transparent 2px,
                     hsl(var(--waveform)) 2px,
                     hsl(var(--waveform)) 3px
                   )`
                 }}>
            </div>
          </div>

          {/* Current time indicator */}
          {currentTime >= viewStart && currentTime <= viewStart + viewDuration && (
            <div
              className="absolute top-0 w-0.5 h-full bg-accent z-10"
              style={{
                left: `${((currentTime - viewStart) / viewDuration) * 100}%`
              }}
            >
              <div className="w-3 h-3 bg-accent rounded-full -ml-1"></div>
            </div>
          )}

          {/* Subtitle segments */}
          <div className="absolute top-24 w-full h-12">
            {subtitles.map((subtitle) => {
              if (subtitle.endTime < viewStart || subtitle.startTime > viewStart + viewDuration) {
                return null;
              }

              const startPos = Math.max(0, ((subtitle.startTime - viewStart) / viewDuration) * 100);
              const endPos = Math.min(100, ((subtitle.endTime - viewStart) / viewDuration) * 100);
              const width = endPos - startPos;
              
              const isSelected = selectedSubtitle?.id === subtitle.id;

              return (
                <div
                  key={subtitle.id}
                  className={`absolute h-8 rounded border-2 flex items-center px-2 text-xs font-medium cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-subtitle-active/20 border-subtitle-active text-subtitle-active' 
                      : 'bg-subtitle-segment/20 border-subtitle-segment text-subtitle-segment hover:bg-subtitle-segment/30'
                  }`}
                  style={{
                    left: `${startPos}%`,
                    width: `${width}%`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubtitleSelect(subtitle);
                  }}
                >
                  <span className="truncate">
                    {subtitle.text || `[${formatTime(subtitle.startTime)} - ${formatTime(subtitle.endTime)}]`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
        <span className="font-medium">Tips:</span> Click to select subtitle • Double-click to create new subtitle • Use zoom controls to adjust view
      </div>
    </Card>
  );
};