import React from 'react';
import { PlaylistSearchItem } from '../types';

interface MusicSearchResultsProps {
  type: 'music';
  results: PlaylistSearchItem[];
  onPlay: (item: PlaylistSearchItem) => void;
  onSavePlaylist: (item: PlaylistSearchItem) => void;
  playingPlaylistId?: string;
  savingPlaylistId?: string;
}

interface PodcastSearchResultsProps {
  type: 'podcast';
  results: PlaylistSearchItem[];
  onAddPlaylist: (playlist: PlaylistSearchItem) => void;
  loadingPlaylistId?: string;
}

type SearchResultsProps = MusicSearchResultsProps | PodcastSearchResultsProps;

export const SearchResults: React.FC<SearchResultsProps> = (props) => {
  if (props.results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No results found. Try a different search term.</p>
      </div>
    );
  }

  if (props.type === 'music') {
    const { results, onPlay, onSavePlaylist, playingPlaylistId, savingPlaylistId } = props;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">🎵 Music Playlists</h3>
          <span className="text-sm text-gray-400">{results.length} playlists found</span>
        </div>
        
        {results.map((playlist) => {
          const isPlaying = playingPlaylistId === playlist.id;
          const isSaving = savingPlaylistId === playlist.id;
          
          return (
            <div
              key={playlist.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isPlaying 
                  ? 'bg-gradient-to-r from-orange-900/50 to-yellow-900/50 border border-orange-500' 
                  : 'bg-black/60 hover:bg-zinc-800/70 border border-zinc-800'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative flex-shrink-0">
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  className="w-20 h-14 object-cover rounded"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">
                  {playlist.itemCount} songs
                </div>
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                    <div className="flex gap-0.5">
                      <div className="w-1 h-4 bg-orange-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-4 bg-yellow-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-4 bg-orange-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate text-sm">{playlist.title}</h4>
                <p className="text-gray-400 text-xs truncate">{playlist.channelTitle}</p>
                {playlist.description && (
                  <p className="text-gray-500 text-xs truncate mt-1">{playlist.description}</p>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Play button */}
                <button
                  onClick={() => onPlay(playlist)}
                  className={`p-2 rounded-full transition-all ${
                    isPlaying
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                      : 'bg-zinc-700 hover:bg-gradient-to-r hover:from-orange-600 hover:to-yellow-500 text-white'
                  }`}
                  title={isPlaying ? 'Now Playing' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                
                {/* Save button */}
                <button
                  onClick={() => onSavePlaylist(playlist)}
                  disabled={isSaving}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    isSaving
                      ? 'bg-gray-600 text-gray-400 cursor-wait'
                      : 'bg-zinc-700 hover:bg-amber-600 text-white'
                  }`}
                  title="Save playlist"
                >
                  {isSaving ? '...' : '+ Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Podcast results (playlists)
  const { results, onAddPlaylist, loadingPlaylistId } = props;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">🎙️ Podcast Playlists</h3>
        <span className="text-sm text-gray-400">{results.length} series found</span>
      </div>
      
      {results.map((playlist) => {
        const isLoading = loadingPlaylistId === playlist.id;
        
        return (
          <div
            key={playlist.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-black/60 hover:bg-zinc-800/70 transition-all border border-zinc-800 hover:border-orange-500/30"
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0">
              <img
                src={playlist.thumbnail}
                alt={playlist.title}
                className="w-20 h-14 object-cover rounded"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">
                {playlist.itemCount} eps
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium truncate text-sm">{playlist.title}</h4>
              <p className="text-gray-400 text-xs truncate">{playlist.channelTitle}</p>
              {playlist.description && (
                <p className="text-gray-500 text-xs truncate mt-1">{playlist.description}</p>
              )}
            </div>
            
            {/* Add button */}
            <button
              onClick={() => onAddPlaylist(playlist)}
              disabled={isLoading}
              className={`px-4 py-2 rounded font-medium transition-all flex items-center gap-2 ${
                isLoading
                  ? 'bg-gray-600 text-gray-400 cursor-wait'
                  : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Save Series</span>
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
