import { useEffect, useRef, useState } from 'react';

interface AudioWaveformProps {
  src: string;
  viewStart: number;
  viewDuration: number;
  onWaveformData?: (data: number[]) => void;
}

export const AudioWaveform = ({ src, viewStart, viewDuration, onWaveformData }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  useEffect(() => {
    if (!src) return;

    const generateWaveform = async () => {
      try {
        // Create audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Fetch audio file
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get audio data
        const rawData = audioBuffer.getChannelData(0); // Use first channel
        const samples = 2000; // Number of samples for waveform
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = [];
        
        // Downsample data
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j] || 0);
          }
          filteredData.push(sum / blockSize);
        }
        
        // Normalize data
        const maxAmplitude = Math.max(...filteredData);
        const normalizedData = filteredData.map(amplitude => amplitude / maxAmplitude);
        
        setWaveformData(normalizedData);
        onWaveformData?.(normalizedData);
        
        audioContext.close();
      } catch (error) {
        console.error('Error generating waveform:', error);
        // Fallback to fake waveform
        const fakeData = Array.from({ length: 2000 }, (_, i) => {
          const time = (i / 2000) * 100;
          return Math.max(0.1, Math.abs(Math.sin(time * 0.05) * 0.8 + Math.sin(time * 0.2) * 0.3));
        });
        setWaveformData(fakeData);
        onWaveformData?.(fakeData);
      }
    };

    generateWaveform();
  }, [src, onWaveformData]);

  useEffect(() => {
    if (!waveformData.length) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Calculate visible portion of waveform
    const totalDuration = 100; // Assume 100 seconds for demo
    const startIndex = Math.floor((viewStart / totalDuration) * waveformData.length);
    const endIndex = Math.floor(((viewStart + viewDuration) / totalDuration) * waveformData.length);
    const visibleData = waveformData.slice(startIndex, endIndex);

    if (visibleData.length === 0) return;

    // Draw waveform
    const barWidth = width / visibleData.length;
    
    visibleData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      ctx.fillStyle = 'hsl(var(--waveform))';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, y, Math.max(1, barWidth - 0.5), barHeight);
    });
  }, [waveformData, viewStart, viewDuration]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={64}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};