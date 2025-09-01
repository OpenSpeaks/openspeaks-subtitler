import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Edit3, Trash2, Plus, Clock, Type } from "lucide-react";

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleWorkspaceProps {
  subtitle: Subtitle | null;
  subtitles: Subtitle[];
  onSubtitleUpdate: (subtitle: Subtitle) => void;
  onSubtitleDelete?: (id: string) => void;
  onSubtitleSelect: (subtitle: Subtitle) => void;
  onSubtitleCreate: (startTime: number, endTime: number) => void;
  onSeek: (time: number) => void;
  language: string;
}

export const SubtitleWorkspace = ({ 
  subtitle,
  subtitles, 
  onSubtitleUpdate,
  onSubtitleDelete,
  onSubtitleSelect,
  onSubtitleCreate,
  onSeek,
  language 
}: SubtitleWorkspaceProps) => {
  const [localSubtitle, setLocalSubtitle] = useState<Subtitle | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLocalSubtitle(subtitle);
  }, [subtitle]);

  // Auto-save when local subtitle changes
  useEffect(() => {
    if (localSubtitle && subtitle && localSubtitle.id === subtitle.id) {
      const hasChanges = 
        localSubtitle.text !== subtitle.text ||
        localSubtitle.startTime !== subtitle.startTime ||
        localSubtitle.endTime !== subtitle.endTime;
      
      if (hasChanges) {
        const timeoutId = setTimeout(() => {
          onSubtitleUpdate(localSubtitle);
        }, 500); // Auto-save after 500ms of no changes
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [localSubtitle, subtitle, onSubtitleUpdate]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
  };

  const formatTimeShort = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    if (!localSubtitle) return;
    
    const newTime = parseTime(value);
    const updatedSubtitle = {
      ...localSubtitle,
      [field]: newTime
    };
    
    // Ensure start time is before end time
    if (field === 'startTime' && newTime >= updatedSubtitle.endTime) {
      updatedSubtitle.endTime = newTime + 1;
    } else if (field === 'endTime' && newTime <= updatedSubtitle.startTime) {
      updatedSubtitle.startTime = Math.max(0, newTime - 1);
    }
    
    setLocalSubtitle(updatedSubtitle);
  };

  const handleTextChange = (text: string) => {
    if (!localSubtitle) return;
    
    setLocalSubtitle({
      ...localSubtitle,
      text
    });
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && localSubtitle) {
      e.preventDefault();
      // Create new subtitle after current one
      const newStartTime = localSubtitle.endTime;
      const newEndTime = newStartTime + 3; // 3 second default duration
      onSubtitleCreate(newStartTime, newEndTime);
    }
  };

  const getDuration = () => {
    if (!localSubtitle) return 0;
    return localSubtitle.endTime - localSubtitle.startTime;
  };

  const getWordCount = () => {
    if (!localSubtitle?.text) return 0;
    return localSubtitle.text.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getWordsPerMinute = () => {
    if (!localSubtitle || !localSubtitle.text) return 0;
    const words = getWordCount();
    const minutes = getDuration() / 60;
    return minutes > 0 ? Math.round(words / minutes) : 0;
  };

  const filteredSubtitles = subtitles
    .filter(sub => 
      sub.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatTimeShort(sub.startTime).includes(searchTerm) ||
      formatTimeShort(sub.endTime).includes(searchTerm)
    )
    .sort((a, b) => a.startTime - b.startTime);

  const handleInsertAfter = () => {
    if (!localSubtitle) return;
    
    // Find the next subtitle's start time or use current + 3 seconds
    const nextSubtitle = subtitles
      .filter(sub => sub.startTime > localSubtitle.endTime)
      .sort((a, b) => a.startTime - b.startTime)[0];
    
    const newStartTime = localSubtitle.endTime;
    const newEndTime = nextSubtitle ? 
      Math.min(nextSubtitle.startTime, newStartTime + 3) : 
      newStartTime + 3;
    
    onSubtitleCreate(newStartTime, newEndTime);
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Type className="w-4 h-4" />
            Subtitle Editor
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              {subtitles.length} items
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {subtitle ? (
          <>
            {/* Timing Controls at top */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Clock className="w-4 h-4" />
                Timing
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                  <Input
                    id="start-time"
                    value={formatTime(localSubtitle?.startTime || 0)}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    className="font-mono text-sm"
                    placeholder="00:00:00.000"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-xs">End Time</Label>
                  <Input
                    id="end-time"
                    value={formatTime(localSubtitle?.endTime || 0)}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    className="font-mono text-sm"
                    placeholder="00:00:00.000"
                  />
                </div>
                <div>
                  <Label className="text-xs">Duration</Label>
                  <div className="text-sm font-mono p-2 bg-muted rounded">
                    {getDuration().toFixed(2)}s
                  </div>
                </div>
              </div>
            </div>

            {/* Text Editor */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Type className="w-4 h-4" />
                  Subtitle Text
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleInsertAfter}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Insert After
                  </Button>
                  {onSubtitleDelete && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onSubtitleDelete(subtitle.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              
              <Textarea
                value={localSubtitle?.text || ""}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleTextKeyDown}
                placeholder="Enter subtitle text... (Press Enter to create new subtitle)"
                className="min-h-20 resize-none"
                rows={3}
              />
              
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Words: {getWordCount()}</span>
                <span>~{getWordsPerMinute()} WPM</span>
              </div>
            </div>

            {/* Reading Guidelines */}
            <div className="p-4 border-b">
              <div className="text-sm font-medium mb-2">Reading Guidelines</div>
              <div className="space-y-1 text-xs">
                <div className={`flex justify-between ${getDuration() >= 2 && getDuration() <= 6 ? 'text-green-600' : 'text-orange-600'}`}>
                  <span>Duration ({getDuration().toFixed(1)}s):</span>
                  <span>{getDuration() >= 2 && getDuration() <= 6 ? '✓ Good' : '⚠ Too ' + (getDuration() < 2 ? 'short' : 'long')}</span>
                </div>
                <div className={`flex justify-between ${getWordCount() <= 8 ? 'text-green-600' : 'text-orange-600'}`}>
                  <span>Length ({getWordCount()} words):</span>
                  <span>{getWordCount() <= 8 ? '✓ Good' : '⚠ Too long'}</span>
                </div>
                <div className={`flex justify-between ${getWordsPerMinute() <= 180 ? 'text-green-600' : 'text-orange-600'}`}>
                  <span>Reading speed ({getWordsPerMinute()} WPM):</span>
                  <span>{getWordsPerMinute() <= 180 ? '✓ Good' : '⚠ Too fast'}</span>
                </div>
              </div>
            </div>

            {/* All Subtitles List */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">All Subtitles</div>
                  <div className="text-xs text-muted-foreground">
                    Auto-saved
                  </div>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subtitles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2">
                  {filteredSubtitles.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No subtitles found</p>
                      <p className="text-xs mt-1">Double-click the timeline to create subtitles</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSubtitles.map((sub, index) => {
                        const isSelected = subtitle?.id === sub.id;
                        
                        return (
                          <div
                            key={sub.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                              isSelected 
                                ? 'bg-primary/10 border-primary/30' 
                                : 'bg-card hover:bg-muted/50 border-border'
                            }`}
                            onClick={() => {
                              onSubtitleSelect(sub);
                              onSeek(sub.startTime);
                            }}
                          >
                            {/* Timing */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="bg-secondary/50 px-1 rounded text-xs">
                                  #{index + 1}
                                </span>
                                <span className="font-mono">
                                  {formatTimeShort(sub.startTime)} → {formatTimeShort(sub.endTime)}
                                </span>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onSubtitleDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSubtitleDelete(sub.id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Text */}
                            <p className={`text-sm leading-relaxed ${
                              sub.text ? 'text-foreground' : 'text-muted-foreground italic'
                            }`}>
                              {sub.text || 'Empty subtitle - click to add text'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-muted-foreground">
              <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">No subtitle selected</h3>
              <p className="text-sm">Click on a subtitle or double-click the timeline to start editing</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};