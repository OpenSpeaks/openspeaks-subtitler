import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Search, Edit3, Trash2, Plus, Clock } from "lucide-react";

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface SubtitleListProps {
  subtitles: Subtitle[];
  selectedSubtitle: Subtitle | null;
  onSubtitleSelect: (subtitle: Subtitle) => void;
  onSubtitleUpdate: (subtitle: Subtitle) => void;
  onSubtitleDelete?: (id: string) => void;
  onSeek: (time: number) => void;
  language: string;
}

export const SubtitleList = ({ 
  subtitles, 
  selectedSubtitle, 
  onSubtitleSelect, 
  onSubtitleUpdate,
  onSubtitleDelete,
  onSeek,
  language 
}: SubtitleListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };

  const filteredSubtitles = subtitles
    .filter(sub => 
      sub.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatTime(sub.startTime).includes(searchTerm) ||
      formatTime(sub.endTime).includes(searchTerm)
    )
    .sort((a, b) => a.startTime - b.startTime);

  const handleEditStart = (subtitle: Subtitle) => {
    setEditingId(subtitle.id);
    setEditText(subtitle.text);
  };

  const handleEditSave = (subtitle: Subtitle) => {
    onSubtitleUpdate({ ...subtitle, text: editText });
    setEditingId(null);
    setEditText("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Subtitle List
          </h3>
          <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
            {language.toUpperCase()} • {subtitles.length} items
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
              {filteredSubtitles.map((subtitle, index) => {
                const isSelected = selectedSubtitle?.id === subtitle.id;
                const isEditing = editingId === subtitle.id;
                
                return (
                  <div
                    key={subtitle.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-card hover:bg-muted/50 border-border'
                    }`}
                    onClick={() => {
                      onSubtitleSelect(subtitle);
                      onSeek(subtitle.startTime);
                    }}
                  >
                    {/* Timing */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono">
                          {formatTime(subtitle.startTime)} → {formatTime(subtitle.endTime)}
                        </span>
                        <span className="bg-secondary/50 px-1 rounded text-xs">
                          #{index + 1}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEditing) {
                              handleEditSave(subtitle);
                            } else {
                              handleEditStart(subtitle);
                            }
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        {onSubtitleDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSubtitleDelete(subtitle.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Text */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-sm"
                          placeholder="Enter subtitle text..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditSave(subtitle);
                            } else if (e.key === 'Escape') {
                              handleEditCancel();
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleEditSave(subtitle)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={handleEditCancel}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-sm leading-relaxed ${
                        subtitle.text ? 'text-foreground' : 'text-muted-foreground italic'
                      }`}>
                        {subtitle.text || 'Empty subtitle - click to add text'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
        <span className="font-medium">Tips:</span> Click to select & jump • Double-click edit icon for quick editing
      </div>
    </Card>
  );
};