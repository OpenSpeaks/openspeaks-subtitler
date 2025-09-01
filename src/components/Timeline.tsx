import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, SkipBack, SkipForward } from "lucide-react";

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
  onSubtitleUpdate: (subtitle: Subtitle) => void;
  onSeek: (time: number) => void;
  selectedSubtitle: Subtitle | null;
}

export const Timeline = ({ 
  subtitles, 
  duration, 
  currentTime, 
  onSubtitleSelect, 
  onSubtitleCreate,
  onSubtitleUpdate,
  onSeek,
  selectedSubtitle 
}: TimelineProps) => {
  const [viewStart, setViewStart] = useState(0);
  const [viewDuration, setViewDuration] = useState(15); // 15 seconds visible
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [dragSubtitle, setDragSubtitle] = useState<Subtitle | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll timeline to follow current time (but not when dragging)
  useEffect(() => {
    if (!isDragging && (currentTime < viewStart || currentTime > viewStart + viewDuration)) {
      setViewStart(Math.max(0, currentTime - viewDuration / 2));
    }
  }, [currentTime, viewStart, viewDuration, isDragging]);

  const getTimeFromPosition = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const timelineWidth = rect.width;
    return viewStart + (clickX / timelineWidth) * viewDuration;
  }, [viewStart, viewDuration]);

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    
    const clickTime = getTimeFromPosition(event.clientX);
    
    // Find if clicked on existing subtitle
    const clickedSubtitle = subtitles.find(sub => 
      clickTime >= sub.startTime && clickTime <= sub.endTime
    );
    
    if (clickedSubtitle) {
      onSubtitleSelect(clickedSubtitle);
    } else {
      // Seek to clicked time
      onSeek(clickTime);
    }
  };

  const handleTimelineDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const clickTime = getTimeFromPosition(event.clientX);
    
    // Check if double-clicked on existing subtitle
    const clickedSubtitle = subtitles.find(sub => 
      clickTime >= sub.startTime && clickTime <= sub.endTime
    );
    
    // Only create new subtitle if not clicking on existing one
    if (!clickedSubtitle) {
      // Find the closest subtitle end time before this position
      const previousSubtitles = subtitles.filter(sub => sub.endTime <= clickTime);
      const lastEndTime = previousSubtitles.length > 0 
        ? Math.max(...previousSubtitles.map(sub => sub.endTime))
        : 0;
      
      // Find the closest subtitle start time after this position
      const nextSubtitles = subtitles.filter(sub => sub.startTime >= clickTime);
      const nextStartTime = nextSubtitles.length > 0 
        ? Math.min(...nextSubtitles.map(sub => sub.startTime))
        : duration;
      
      // Create subtitle starting after the last one ends
      const startTime = Math.max(clickTime, lastEndTime);
      const defaultDuration = 3;
      const endTime = Math.min(startTime + defaultDuration, nextStartTime, duration);
      
      if (endTime > startTime) {
        onSubtitleCreate(startTime, endTime);
      }
    }
  };

  // Handle mouse drag operations
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragSubtitle || !timelineRef.current) return;

      const currentX = e.clientX;
      const deltaX = currentX - dragStartX;
      const rect = timelineRef.current.getBoundingClientRect();
      const deltaTime = (deltaX / rect.width) * viewDuration;

      let updatedSubtitle = { ...dragSubtitle };

      switch (dragType) {
        case 'move': {
          const newStartTime = Math.max(0, dragStartTime + deltaTime);
          const duration = dragSubtitle.endTime - dragSubtitle.startTime;
          updatedSubtitle.startTime = newStartTime;
          updatedSubtitle.endTime = newStartTime + duration;
          break;
        }
        case 'resize-left': {
          const newStartTime = Math.max(0, Math.min(dragStartTime + deltaTime, dragSubtitle.endTime - 0.1));
          updatedSubtitle.startTime = newStartTime;
          break;
        }
        case 'resize-right': {
          const newEndTime = Math.max(dragSubtitle.startTime + 0.1, dragStartTime + deltaTime);
          updatedSubtitle.endTime = newEndTime;
          break;
        }
      }

      if (updatedSubtitle !== dragSubtitle) {
        onSubtitleUpdate(updatedSubtitle);
        setDragSubtitle(updatedSubtitle);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDragSubtitle(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragSubtitle, dragType, dragStartX, dragStartTime, viewDuration, onSubtitleUpdate]);

  const zoomIn = () => {
    setViewDuration(prev => Math.max(1, prev / 2));
  };

  const zoomOut = () => {
    if (duration > 0) {
      setViewDuration(prev => {
        const newDuration = Math.min(duration, prev * 2);
        // If zooming out to see entire timeline, adjust view start
        if (newDuration >= duration) {
          setViewStart(0);
          return duration;
        }
        return newDuration;
      });
    }
  };

  const panLeft = () => {
    setViewStart(prev => Math.max(0, prev - viewDuration / 4));
  };

  const panRight = () => {
    setViewStart(prev => Math.min(duration - viewDuration, prev + viewDuration / 4));
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
          <Button variant="outline" size="sm" onClick={panLeft} disabled={viewStart <= 0}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={panRight} disabled={viewStart + viewDuration >= duration}>
            <SkipForward className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {viewDuration >= duration ? 'Full timeline' : `${viewDuration.toFixed(1)}s visible`}
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

          {/* Enhanced Waveform visualization */}
          <div className="absolute top-8 w-full h-16 bg-gradient-to-r from-waveform/20 to-waveform/10">
            <div className="w-full h-full flex items-center justify-center">
              {/* Simulated waveform bars */}
              {Array.from({ length: Math.floor(viewDuration * 10) }).map((_, i) => {
                const height = Math.random() * 60 + 10; // Random height between 10-70%
                const opacity = 0.3 + Math.random() * 0.4; // Random opacity 0.3-0.7
                return (
                  <div
                    key={i}
                    className="bg-waveform mx-0.5"
                    style={{
                      width: '2px',
                      height: `${height}%`,
                      opacity: opacity
                    }}
                  />
                );
              })}
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

          {/* Subtitle segments with drag handles */}
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
                  className={`absolute h-8 rounded border-2 flex items-center px-2 text-xs font-medium transition-all group ${
                    isSelected 
                      ? 'bg-subtitle-active/20 border-subtitle-active text-subtitle-active' 
                      : 'bg-subtitle-segment/20 border-subtitle-segment text-subtitle-segment hover:bg-subtitle-segment/30'
                  }`}
                  style={{
                    left: `${startPos}%`,
                    width: `${width}%`
                  }}
                >
                  {/* Left resize handle */}
                  <div
                    className="absolute -left-1 top-0 w-2 h-full bg-subtitle-active cursor-w-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDragging(true);
                      setDragType('resize-left');
                      setDragSubtitle(subtitle);
                      setDragStartX(e.clientX);
                      setDragStartTime(subtitle.startTime);
                    }}
                  />
                  
                  {/* Main content - clickable and draggable */}
                  <div
                    className="flex-1 cursor-pointer truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubtitleSelect(subtitle);
                    }}
                    onMouseDown={(e) => {
                      if (e.detail === 1) { // Single click
                        setIsDragging(true);
                        setDragType('move');
                        setDragSubtitle(subtitle);
                        setDragStartX(e.clientX);
                        setDragStartTime(subtitle.startTime);
                      }
                    }}
                  >
                    {subtitle.text || `[${formatTime(subtitle.startTime)} - ${formatTime(subtitle.endTime)}]`}
                  </div>
                  
                  {/* Right resize handle */}
                  <div
                    className="absolute -right-1 top-0 w-2 h-full bg-subtitle-active cursor-e-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsDragging(true);
                      setDragType('resize-right');
                      setDragSubtitle(subtitle);
                      setDragStartX(e.clientX);
                      setDragStartTime(subtitle.endTime);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
        <span className="font-medium">Tips:</span> Click subtitle to select • Double-click empty space to create • Drag to move • Drag handles to resize • Use pan/zoom controls
      </div>
    </Card>
  );
};