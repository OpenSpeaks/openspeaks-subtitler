import { useRef } from "react";
import { Upload, FileVideo, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface FileUploadProps {
  onFileUpload: (file: File, url: string) => void;
}

export const FileUpload = ({ onFileUpload }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a video or audio file
    const validTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/mov', 'video/avi',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'
    ];

    if (!validTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
      toast.error("Please select a valid video or audio file");
      return;
    }

    const url = URL.createObjectURL(file);
    onFileUpload(file, url);
    toast.success(`File "${file.name}" loaded successfully!`);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Create a fake input event
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileSelect({ target: input } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Card className="w-full max-w-lg p-8">
      <div
        className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center hover:border-primary/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Upload your media file</h3>
        <p className="text-muted-foreground mb-6">
          Drag and drop or click to select a video or audio file
        </p>
        
        <div className="flex justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileVideo className="w-4 h-4" />
            <span>Video files</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileAudio className="w-4 h-4" />
            <span>Audio files</span>
          </div>
        </div>
        
        <Button onClick={() => fileInputRef.current?.click()}>
          Choose File
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="video/*,audio/*"
          onChange={handleFileSelect}
        />
      </div>
    </Card>
  );
};