import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { LanguageSelector } from "./LanguageSelector";

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface ExportPanelProps {
  subtitles: Subtitle[];
  fileName: string;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export const ExportPanel = ({ subtitles, fileName, selectedLanguage, onLanguageChange }: ExportPanelProps) => {
  const [exportFormat, setExportFormat] = useState<'srt' | 'vtt' | 'txt' | 'txt-time'>('srt');

  const formatTime = (seconds: number, format: 'srt' | 'vtt') => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    if (format === 'srt') {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    } else {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
  };

  const generateSRT = () => {
    return subtitles
      .sort((a, b) => a.startTime - b.startTime)
      .map((subtitle, index) => {
        return `${index + 1}\n${formatTime(subtitle.startTime, 'srt')} --> ${formatTime(subtitle.endTime, 'srt')}\n${subtitle.text}\n`;
      })
      .join('\n');
  };

  const generateVTT = () => {
    const subtitleContent = subtitles
      .sort((a, b) => a.startTime - b.startTime)
      .map((subtitle) => {
        return `${formatTime(subtitle.startTime, 'vtt')} --> ${formatTime(subtitle.endTime, 'vtt')}\n${subtitle.text}\n`;
      })
      .join('\n');
    
    return `WEBVTT\n\n${subtitleContent}`;
  };

  const generatePlainText = () => {
    return subtitles
      .sort((a, b) => a.startTime - b.startTime)
      .map((subtitle) => subtitle.text)
      .filter(text => text.trim())
      .join('\n');
  };

  const generatePlainTextWithTime = () => {
    return subtitles
      .sort((a, b) => a.startTime - b.startTime)
      .map((subtitle) => {
        const timeRange = `[${formatTime(subtitle.startTime, 'srt')} --> ${formatTime(subtitle.endTime, 'srt')}]`;
        return `${timeRange}\n${subtitle.text}`;
      })
      .filter(entry => entry.includes('\n') && entry.split('\n')[1].trim())
      .join('\n\n');
  };

  const generateFileName = () => {
    if (!fileName) return `subtitles-${selectedLanguage}.${exportFormat === 'txt-time' ? 'txt' : exportFormat}`;
    
    // Remove extension from original filename
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const extension = exportFormat === 'txt-time' ? 'txt' : exportFormat;
    return `${nameWithoutExt}-${selectedLanguage}.${extension}`;
  };

  const handleExport = () => {
    if (subtitles.length === 0) {
      toast.error("No subtitles to export. Create some subtitles first.");
      return;
    }

    let content = '';
    switch (exportFormat) {
      case 'srt':
        content = generateSRT();
        break;
      case 'vtt':
        content = generateVTT();
        break;
      case 'txt':
        content = generatePlainText();
        break;
      case 'txt-time':
        content = generatePlainTextWithTime();
        break;
      default:
        content = generateSRT();
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const formatName = exportFormat === 'txt-time' ? 'Plain text with timestamps' : exportFormat.toUpperCase();
    toast.success(`Downloaded ${subtitles.length} subtitles as ${formatName}`);
  };

  return (
    <Card className="p-4">
      {/* Language Selection */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-2">Language</div>
        <LanguageSelector 
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
        />
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download Subtitles
        </h3>
        <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
          {subtitles.length} subtitles
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={exportFormat} onValueChange={(value: 'srt' | 'vtt' | 'txt' | 'txt-time') => setExportFormat(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="srt">SRT</SelectItem>
            <SelectItem value="vtt">VTT</SelectItem>
            <SelectItem value="txt">Plain Text</SelectItem>
            <SelectItem value="txt-time">Text + Time</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={handleExport} disabled={subtitles.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        {exportFormat === 'srt' && 'SubRip subtitle format'}
        {exportFormat === 'vtt' && 'WebVTT subtitle format'}
        {exportFormat === 'txt' && 'Plain text without timestamps'}
        {exportFormat === 'txt-time' && 'Plain text with timestamps'}
      </div>
    </Card>
  );
};