import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Clock, Type, Save, Trash2 } from "lucide-react";

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleEditorProps {
  subtitle: Subtitle | null;
  onSubtitleUpdate: (subtitle: Subtitle) => void;
  language: string;
}

export const SubtitleEditor = ({ subtitle, onSubtitleUpdate, language }: SubtitleEditorProps) => {
  const [localSubtitle, setLocalSubtitle] = useState<Subtitle | null>(null);

  useEffect(() => {
    setLocalSubtitle(subtitle);
  }, [subtitle]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
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

  const handleSave = () => {
    if (localSubtitle) {
      onSubtitleUpdate(localSubtitle);
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

  if (!subtitle) {
    return (
      <Card className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-medium mb-2">No subtitle selected</h3>
          <p className="text-sm">Click on a subtitle or double-click the timeline to start editing</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Type className="w-4 h-4" />
            Subtitle Editor
          </h3>
          <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
            {language.toUpperCase()}
          </div>
        </div>
      </div>

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
            placeholder="Enter subtitle text..."
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
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
        <Button variant="outline" size="icon">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};