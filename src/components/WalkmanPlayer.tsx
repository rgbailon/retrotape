import { useState, useEffect } from 'react';
import { VideoItem } from '../types';

interface WalkmanPlayerProps {
  currentTrack: VideoItem | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  playlistName?: string;
  playlistType?: 'music' | 'podcast';
}

export const WalkmanPlayer = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  volume,
  onPlayPause,
  onPrevious,
  onNext,
  onStop,
  onSeek,
  onVolumeChange,
  playlistName,
  playlistType,
}: WalkmanPlayerProps) => {
  const [displayText, setDisplayText] = useState('');
  const [scrollOffset, setScrollOffset] = useState(0);
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const fullText = currentTrack 
    ? `♪ ${currentTrack.title} - ${currentTrack.channelTitle} ♪` 
    : 'NO TAPE';

  // Scrolling text effect
  useEffect(() => {
    if (!isPlaying || !currentTrack) {
      setDisplayText(currentTrack ? currentTrack.title.slice(0, 20) : 'NO TAPE');
      setScrollOffset(0);
      return;
    }

    const interval = setInterval(() => {
      setScrollOffset(prev => {
        const next = prev + 1;
        if (next >= fullText.length) return 0;
        return next;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, fullText]);

  useEffect(() => {
    const scrolledText = fullText.slice(scrollOffset) + '    ' + fullText.slice(0, scrollOffset);
    setDisplayText(scrolledText.slice(0, 24));
  }, [scrollOffset, fullText]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    onSeek(percent * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(Number(e.target.value));
  };

  const isPodcast = playlistType === 'podcast';

  return (
    <div className="bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-700 rounded-2xl p-1 shadow-2xl">
      {/* Walkman body */}
      <div className="bg-gradient-to-br from-black via-zinc-900 to-black rounded-xl p-4">
        {/* Brand label */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            RETROTAPE
          </div>
          <div className="text-xs text-gray-500">{isPodcast ? 'PODCAST' : 'MUSIC'}</div>
        </div>

        {/* LCD Display */}
        <div className="bg-gradient-to-b from-amber-900 to-amber-950 rounded-lg p-3 mb-4 border-2 border-gray-900 shadow-inner">
          {/* Playlist name */}
          <div className="text-amber-300/50 text-xs font-mono mb-1 truncate">
            {playlistName || 'STANDBY'}
          </div>
          
          {/* Main scrolling text */}
          <div className="text-amber-400 font-mono text-lg tracking-wider overflow-hidden">
            {displayText}
          </div>
          
          {/* Status bar */}
          <div className="flex justify-between items-center mt-2 text-amber-300 font-mono text-xs">
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <span className="flex items-center gap-1">
                  <span className="animate-pulse">▶</span> PLAY
                </span>
              ) : currentTrack ? (
                <span>⏸ PAUSE</span>
              ) : (
                <span>⏹ STOP</span>
              )}
            </div>
            <div>{formatTime(progress)} / {formatTime(duration)}</div>
          </div>

          {/* Progress bar in LCD */}
          <div className="mt-2 h-1.5 bg-amber-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tape window */}
        <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg p-2 mb-4 border-2 border-gray-900">
          <div className="flex justify-between items-center">
            {/* Left reel */}
            <div className={`w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '1s' }}>
              <div className="w-3 h-3 bg-gray-300 rounded-sm" />
            </div>
            
            {/* Tape path */}
            <div className="flex-1 mx-2 h-2 bg-amber-800/50 rounded relative overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {/* Right reel */}
            <div className={`w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '1s' }}>
              <div className="w-3 h-3 bg-gray-300 rounded-sm" />
            </div>
          </div>
        </div>

        {/* Seek bar */}
        <div 
          className="h-2 bg-gray-900 rounded cursor-pointer mb-4 overflow-hidden border border-zinc-700"
          onClick={handleSeekClick}
        >
          <div 
            className="h-full transition-all bg-gradient-to-r from-orange-500 to-yellow-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f97316 ${volume}%, #1f2937 ${volume}%)`
            }}
          />
          <div className="text-gray-500">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </div>
          <span className="text-xs text-gray-500 w-8">{volume}%</span>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={onStop}
            className="aspect-square rounded bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-all active:scale-95 border border-gray-700"
            title="Stop"
          >
            <div className="w-3 h-3 bg-gray-400 rounded-sm" />
          </button>
          
          <button
            onClick={onPrevious}
            disabled={!currentTrack}
            className="aspect-square rounded bg-gray-900 hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 border border-gray-700"
            title="Previous"
          >
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          
          <button
            onClick={onPlayPause}
            disabled={!currentTrack}
            className="aspect-square rounded bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 text-white shadow-lg shadow-orange-900/50"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={onNext}
            disabled={!currentTrack}
            className="aspect-square rounded bg-gray-900 hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 border border-gray-700"
            title="Next"
          >
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          
          <button
            onClick={onStop}
            className="aspect-square rounded bg-gray-900 hover:bg-gray-800 flex items-center justify-center transition-all active:scale-95 border border-gray-700"
            title="Eject"
          >
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 17h14v2H5zm7-12L5.33 15h13.34z" />
            </svg>
          </button>
        </div>

        {/* Track info */}
        {currentTrack && (
          <div className="mt-4 text-center border-t border-zinc-800 pt-3">
            <div className="text-sm text-gray-400 truncate">{currentTrack.title}</div>
            <div className="text-xs text-gray-600 truncate">{currentTrack.channelTitle}</div>
          </div>
        )}
      </div>
    </div>
  );
};
