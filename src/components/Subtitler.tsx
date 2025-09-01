import { useState } from "react";
import { FileUpload } from "./FileUpload";
import { LanguageSelector } from "./LanguageSelector";
import { Timeline } from "./Timeline";
import { SubtitleWorkspace } from "./SubtitleWorkspace";
import { ExportPanel } from "./ExportPanel";
import { VideoPlayer } from "./VideoPlayer";

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export const Subtitler = () => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState("hi");
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState<Subtitle | null>(null);
  const [duration, setDuration] = useState(0);

  const handleFileUpload = (file: File, url: string) => {
    setMediaFile(file);
    setMediaUrl(url);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleDurationChange = (dur: number) => {
    setDuration(dur);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleSubtitleSelect = (subtitle: Subtitle) => {
    setSelectedSubtitle(subtitle);
  };

  const handleSubtitleUpdate = (subtitle: Subtitle) => {
    setSubtitles(prev => 
      prev.map(sub => sub.id === subtitle.id ? subtitle : sub)
    );
    setSelectedSubtitle(subtitle);
  };

  const handleSubtitleDelete = (id: string) => {
    setSubtitles(prev => prev.filter(sub => sub.id !== id));
    if (selectedSubtitle?.id === id) {
      setSelectedSubtitle(null);
    }
  };

  const handleSubtitleCreate = (startTime: number, endTime: number) => {
    const newSubtitle: Subtitle = {
      id: `subtitle-${Date.now()}`,
      startTime,
      endTime,
      text: ""
    };
    setSubtitles(prev => [...prev, newSubtitle].sort((a, b) => a.startTime - b.startTime));
    setSelectedSubtitle(newSubtitle);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">OpenSpeaks Subtitler</h1>
            <p className="text-sm text-muted-foreground">Professional subtitle editing made simple</p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {!mediaFile ? (
          <div className="flex-1 flex items-center justify-center">
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        ) : (
          <>
            {/* Video Player */}
            <div className="h-64 bg-black flex items-center justify-center">
              <VideoPlayer 
                src={mediaUrl}
                currentTime={currentTime}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                onSeek={handleSeek}
              />
            </div>
            
            {/* Timeline */}
            <div className="h-64 min-h-0">
              <Timeline 
                subtitles={subtitles}
                duration={duration}
                currentTime={currentTime}
                onSubtitleSelect={handleSubtitleSelect}
                onSubtitleCreate={handleSubtitleCreate}
                onSubtitleUpdate={handleSubtitleUpdate}
                onSeek={handleSeek}
                selectedSubtitle={selectedSubtitle}
                mediaUrl={mediaUrl}
              />
            </div>

            {/* Bottom Panel - Subtitle Workspace & Download */}
            <div className="flex-1 flex min-h-0 p-4 bg-card gap-4">
              <div className="flex-1">
                <SubtitleWorkspace
                  subtitle={selectedSubtitle}
                  subtitles={subtitles}
                  onSubtitleUpdate={handleSubtitleUpdate}
                  onSubtitleDelete={handleSubtitleDelete}
                  onSubtitleSelect={handleSubtitleSelect}
                  onSubtitleCreate={handleSubtitleCreate}
                  onSeek={handleSeek}
                  language={selectedLanguage}
                />
              </div>
              <div className="w-80">
                <ExportPanel 
                  subtitles={subtitles}
                  fileName={mediaFile?.name || ""}
                  selectedLanguage={selectedLanguage}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t px-6 py-3 text-center text-sm text-muted-foreground">
        © 2025. Subhashish Panigrahi. MIT License.
      </footer>
    </div>
  );
};