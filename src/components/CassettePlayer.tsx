import { useState, useEffect } from 'react';
import { VideoItem } from '../types';

interface CassettePlayerProps {
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

export const CassettePlayer = ({
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
}: CassettePlayerProps) => {
  const [vuLevels, setVuLevels] = useState<number[]>(Array(16).fill(0.3));
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  // Animate VU meter when playing
  useEffect(() => {
    if (!isPlaying) {
      setVuLevels(Array(16).fill(0.3));
      return;
    }
    
    const interval = setInterval(() => {
      setVuLevels(
        Array(16).fill(0).map(() => Math.random() * 0.7 + 0.3)
      );
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Orange-yellow gradient theme
  const isPodcast = playlistType === 'podcast';

  return (
    <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 rounded-2xl p-6 shadow-2xl border-4 border-zinc-800">
      {/* Cassette top label */}
      <div className="bg-gradient-to-r from-orange-100 via-amber-50 to-yellow-100 rounded-lg p-3 mb-4 shadow-inner">
        <div className="flex justify-between items-center">
          <div className="text-xs font-mono text-gray-600">
            {isPodcast ? 'PODCAST' : 'MUSIC'} • 90min
          </div>
          <div className="text-xs font-bold bg-gradient-to-r from-orange-600 to-yellow-500 bg-clip-text text-transparent">
            RetroTape
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-lg font-bold truncate bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-transparent">
            {playlistName || 'No Tape Loaded'}
          </div>
          <div className="text-xs text-gray-500 truncate mt-1">
            {currentTrack ? currentTrack.title : 'Insert tape to play'}
          </div>
        </div>
      </div>

      {/* Cassette reels */}
      <div className="bg-gray-950 rounded-lg p-4 relative border border-zinc-800">
        <div className="flex justify-between items-center">
          {/* Left reel */}
          <div className="relative">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-600 via-gray-700 to-gray-900 border-4 border-gray-500 flex items-center justify-center shadow-lg ${
              isPlaying ? 'animate-spin' : ''
            }`} style={{ animationDuration: '2s' }}>
              {/* Tape wound on reel */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950" 
                style={{ 
                  background: `conic-gradient(from 0deg, #92400e ${100 - progressPercent * 0.8}%, #78716c ${100 - progressPercent * 0.8 + 5}%, #92400e ${100 - progressPercent * 0.6}%, #78716c ${100 - progressPercent * 0.6 + 5}%, #92400e ${100 - progressPercent * 0.4}%, #78716c ${100 - progressPercent * 0.4 + 5}%, #92400e ${100 - progressPercent * 0.2}%, #78716c ${100 - progressPercent * 0.2 + 5}%, #92400e ${100 - progressPercent}%, #78716c ${100 - progressPercent + 5}%)`,
                }} 
              />
              {/* Spokes */}
              <div className="absolute inset-1 rounded-full bg-transparent overflow-hidden">
                <div className="absolute inset-0" style={{
                  background: `repeating-conic-gradient(from 0deg, transparent 0deg 15deg, rgba(0,0,0,0.3) 15deg 18deg)`
                }} />
              </div>
              {/* Inner reel hub */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 border-2 border-gray-600 flex items-center justify-center z-10 shadow-inner">
                {/* Center spindle hole */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border border-gray-600 flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-gray-950" />
                </div>
              </div>
            </div>
          </div>

          {/* Center display / Tape window */}
          <div className="flex-1 mx-4">
            {/* VU Meter */}
            <div className="bg-black rounded p-2 mb-2 border border-zinc-800">
              <div className="flex justify-center gap-0.5 h-8">
                {vuLevels.slice(0, 8).map((level, i) => (
                  <div key={`left-${i}`} className="flex flex-col-reverse gap-0.5 w-2">
                    {[...Array(5)].map((_, j) => (
                      <div
                        key={j}
                        className={`h-1.5 rounded-sm transition-all duration-75 ${
                          j / 5 < level 
                            ? j >= 4 ? 'bg-red-500' : j >= 3 ? 'bg-yellow-400' : 'bg-orange-500'
                            : 'bg-gray-800'
                        }`}
                      />
                    ))}
                  </div>
                ))}
                <div className="w-px bg-gray-700 mx-1" />
                {vuLevels.slice(8).map((level, i) => (
                  <div key={`right-${i}`} className="flex flex-col-reverse gap-0.5 w-2">
                    {[...Array(5)].map((_, j) => (
                      <div
                        key={j}
                        className={`h-1.5 rounded-sm transition-all duration-75 ${
                          j / 5 < level 
                            ? j >= 4 ? 'bg-red-500' : j >= 3 ? 'bg-yellow-400' : 'bg-orange-500'
                            : 'bg-gray-800'
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Tape path visualization */}
            <div className="relative h-3 bg-amber-900/30 rounded overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full transition-all duration-300 bg-gradient-to-r from-orange-600 to-yellow-500"
                style={{ width: `${progressPercent}%` }}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
              )}
            </div>
          </div>

          {/* Right reel */}
          <div className="relative">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-600 via-gray-700 to-gray-900 border-4 border-gray-500 flex items-center justify-center shadow-lg ${
              isPlaying ? 'animate-spin' : ''
            }`} style={{ animationDuration: '2s' }}>
              {/* Tape wound on reel */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950" 
                style={{ 
                  background: `conic-gradient(from 0deg, #92400e ${progressPercent * 0.8}%, #78716c ${progressPercent * 0.8 + 5}%, #92400e ${progressPercent * 0.6}%, #78716c ${progressPercent * 0.6 + 5}%, #92400e ${progressPercent * 0.4}%, #78716c ${progressPercent * 0.4 + 5}%, #92400e ${progressPercent * 0.2}%, #78716c ${progressPercent * 0.2 + 5}%, #92400e ${progressPercent}%, #78716c ${progressPercent + 5}%)`,
                }} 
              />
              {/* Spokes */}
              <div className="absolute inset-1 rounded-full bg-transparent overflow-hidden">
                <div className="absolute inset-0" style={{
                  background: `repeating-conic-gradient(from 0deg, transparent 0deg 15deg, rgba(0,0,0,0.3) 15deg 18deg)`
                }} />
              </div>
              {/* Inner reel hub */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gray-400 via-gray-300 to-gray-500 border-2 border-gray-600 flex items-center justify-center z-10 shadow-inner">
                {/* Center spindle hole */}
                <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border border-gray-600 flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-gray-950" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time display */}
        <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Progress bar (seekable) */}
      <div 
        className="mt-4 h-2 bg-gray-800 rounded-full cursor-pointer overflow-hidden border border-zinc-700"
        onClick={handleSeekClick}
      >
        <div 
          className="h-full transition-all bg-gradient-to-r from-orange-600 to-yellow-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Volume Control */}
      <div className="mt-4 flex items-center gap-3">
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
          className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          style={{
            background: `linear-gradient(to right, #ea580c ${volume}%, #1f2937 ${volume}%)`
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
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={onStop}
          className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all active:scale-95 border border-zinc-700"
          title="Stop"
        >
          <div className="w-4 h-4 bg-gray-400 rounded-sm" />
        </button>
        
        <button
          onClick={onPrevious}
          disabled={!currentTrack}
          className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 border border-zinc-700"
          title="Previous"
        >
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        
        <button
          onClick={onPlayPause}
          disabled={!currentTrack}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-orange-900/50"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        
        <button
          onClick={onNext}
          disabled={!currentTrack}
          className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 border border-zinc-700"
          title="Next"
        >
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
        
        <button
          onClick={onStop}
          className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-all active:scale-95 border border-zinc-700"
          title="Eject"
        >
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 17h14v2H5zm7-12L5.33 15h13.34z" />
          </svg>
        </button>
      </div>

      {/* Track info footer */}
      {currentTrack && (
        <div className="mt-4 text-center border-t border-zinc-800 pt-4">
          <div className="text-sm text-gray-400 truncate">{currentTrack.title}</div>
          <div className="text-xs text-gray-600 truncate">{currentTrack.channelTitle}</div>
        </div>
      )}
    </div>
  );
};
