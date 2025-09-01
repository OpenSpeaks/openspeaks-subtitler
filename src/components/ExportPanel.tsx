import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

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
}

export const ExportPanel = ({ subtitles, fileName, selectedLanguage }: ExportPanelProps) => {
  const [exportFormat, setExportFormat] = useState<'srt' | 'vtt'>('srt');

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

  const generateFileName = () => {
    if (!fileName) return `subtitles-${selectedLanguage}.${exportFormat}`;
    
    // Remove extension from original filename
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}-${selectedLanguage}.${exportFormat}`;
  };

  const handleExport = () => {
    if (subtitles.length === 0) {
      toast.error("No subtitles to export. Create some subtitles first.");
      return;
    }

    const content = exportFormat === 'srt' ? generateSRT() : generateVTT();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = generateFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${subtitles.length} subtitles as ${exportFormat.toUpperCase()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={exportFormat} onValueChange={(value: 'srt' | 'vtt') => setExportFormat(value)}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="srt">SRT</SelectItem>
          <SelectItem value="vtt">VTT</SelectItem>
        </SelectContent>
      </Select>
      
      <Button onClick={handleExport} disabled={subtitles.length === 0}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    </div>
  );
};