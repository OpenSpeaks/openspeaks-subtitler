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

  const getCharacterCount = () => {
    return localSubtitle?.text.length || 0;
  };

  const getWordsPerMinute = () => {
    if (!localSubtitle || !localSubtitle.text) return 0;
    const words = localSubtitle.text.split(/\s+/).filter(word => word.length > 0).length;
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

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Type className="w-4 h-4" />
            Subtitle Editor & List
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              {subtitles.length} items
            </div>
            <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              {language.toUpperCase()}
            </div>
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

      <div className="flex-1 flex">
        {/* Left side - Current Subtitle Editor */}
        <div className="w-96 border-r">
          {subtitle ? (
            <>
              {/* Editor Content */}
              <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                {/* Timing Controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Timing
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Duration: {getDuration().toFixed(2)}s
                  </div>
                </div>

                <Separator />

                {/* Text Editor */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Type className="w-4 h-4" />
                    Subtitle Text
                  </div>
                  
                  <Textarea
                    value={localSubtitle?.text || ""}
                    onChange={(e) => handleTextChange(e.target.value)}
                    onKeyDown={handleTextKeyDown}
                    placeholder="Enter subtitle text... (Press Enter to create new subtitle)"
                    className="min-h-24 resize-none"
                    rows={4}
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Characters: {getCharacterCount()}</span>
                    <span>~{getWordsPerMinute()} WPM</span>
                  </div>
                </div>

                <Separator />

                {/* Reading Guidelines */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Reading Guidelines</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className={`flex justify-between ${getDuration() >= 2 && getDuration() <= 6 ? 'text-green-600' : 'text-orange-600'}`}>
                      <span>Duration:</span>
                      <span>{getDuration() >= 2 && getDuration() <= 6 ? '✓ Good' : '⚠ Too ' + (getDuration() < 2 ? 'short' : 'long')}</span>
                    </div>
                    <div className={`flex justify-between ${getCharacterCount() <= 42 ? 'text-green-600' : 'text-orange-600'}`}>
                      <span>Length:</span>
                      <span>{getCharacterCount() <= 42 ? '✓ Good' : '⚠ Too long'}</span>
                    </div>
                    <div className={`flex justify-between ${getWordsPerMinute() <= 180 ? 'text-green-600' : 'text-orange-600'}`}>
                      <span>Reading speed:</span>
                      <span>{getWordsPerMinute() <= 180 ? '✓ Good' : '⚠ Too fast'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t flex gap-2">
                {onSubtitleDelete && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onSubtitleDelete(subtitle.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
                <div className="text-xs text-muted-foreground flex items-center ml-auto">
                  Auto-saved
                </div>
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

        {/* Right side - Subtitle List */}
        <div className="flex-1 flex flex-col">
          {/* Subtitle List */}
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
                            <Clock className="w-3 h-3" />
                            <span className="font-mono">
                              {formatTimeShort(sub.startTime)} → {formatTimeShort(sub.endTime)}
                            </span>
                            <span className="bg-secondary/50 px-1 rounded text-xs">
                              #{index + 1}
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

          {/* Footer */}
          <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
            <span className="font-medium">Tips:</span> Click to select & jump • Press Enter in text to create new subtitle
          </div>
        </div>
      </div>
    </Card>
  );
};