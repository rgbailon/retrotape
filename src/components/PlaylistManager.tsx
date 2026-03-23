import React, { useState } from 'react';
import { Playlist, VideoItem } from '../types';

interface PlaylistManagerProps {
  playlists: Playlist[];
  onSavePlaylist: (name: string, items: VideoItem[], type: 'music' | 'podcast') => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
  selectedItems: VideoItem[];
  onClearSelection: () => void;
  currentPlaylistId?: string;
  activeTab: 'music' | 'podcast';
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  onSavePlaylist,
  onPlayPlaylist,
  onDeletePlaylist,
  selectedItems,
  onClearSelection,
  currentPlaylistId,
  activeTab,
}) => {
  const [playlistName, setPlaylistName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);

  const musicPlaylists = playlists.filter(p => p.type === 'music');
  const podcastPlaylists = playlists.filter(p => p.type === 'podcast');

  const handleSave = () => {
    if (playlistName.trim() && selectedItems.length > 0) {
      onSavePlaylist(playlistName.trim(), selectedItems, 'music');
      setPlaylistName('');
      setShowSaveModal(false);
      onClearSelection();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const renderPlaylistSection = (title: string, icon: string, sectionPlaylists: Playlist[], type: 'music' | 'podcast') => (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>{icon}</span>
        <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">{title}</span>
        <span className="text-sm font-normal text-gray-400">({sectionPlaylists.length})</span>
      </h3>
      
      {sectionPlaylists.length === 0 ? (
        <div className="text-center py-6 bg-black/40 rounded-lg border border-dashed border-zinc-800">
          <p className="text-gray-500 text-sm">
            {type === 'music' 
              ? 'No saved music playlists yet. Search and add songs to create one!'
              : 'No saved podcast series yet. Search for podcasts to add!'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sectionPlaylists.map((playlist) => {
            const isPlaying = currentPlaylistId === playlist.id;
            const isExpanded = expandedPlaylist === playlist.id;
            
            return (
              <div
                key={playlist.id}
                className={`rounded-lg overflow-hidden transition-all ${
                  isPlaying 
                    ? 'bg-gradient-to-r from-orange-900/40 to-yellow-900/40 border border-orange-500'
                    : 'bg-black/60 border border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Playlist thumbnail grid */}
                  <div className="flex-shrink-0 w-14 h-14 rounded overflow-hidden grid grid-cols-2 gap-0.5 bg-zinc-700">
                    {playlist.items.slice(0, 4).map((item, i) => (
                      <img
                        key={i}
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ))}
                    {playlist.items.length < 4 && 
                      Array(4 - Math.min(playlist.items.length, 4)).fill(0).map((_, i) => (
                        <div key={`empty-${i}`} className="w-full h-full bg-zinc-600" />
                      ))
                    }
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium truncate">{playlist.name}</h4>
                      {isPlaying && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                          Playing
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs">
                      {playlist.items.length} {type === 'music' ? 'tracks' : 'episodes'} • {formatDate(playlist.createdAt)}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedPlaylist(isExpanded ? null : playlist.id)}
                      className="p-2 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white transition-all"
                      title="Show tracks"
                    >
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => onPlayPlaylist(playlist)}
                      className={`p-2 rounded-full transition-all ${
                        isPlaying
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white'
                          : 'bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 text-white'
                      }`}
                      title="Play"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Delete this playlist?')) {
                          onDeletePlaylist(playlist.id);
                        }
                      }}
                      className="p-2 rounded-full bg-zinc-700 hover:bg-red-600 text-white transition-all"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Expanded track list */}
                {isExpanded && (
                  <div className="border-t border-zinc-700 max-h-60 overflow-y-auto">
                    {playlist.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-700/50 text-sm"
                      >
                        <span className="text-gray-500 w-6 text-right">{index + 1}</span>
                        <img src={item.thumbnail} alt="" className="w-8 h-6 object-cover rounded" />
                        <span className="text-white truncate flex-1">{item.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Selection bar - only show in music tab when items are selected */}
      {activeTab === 'music' && selectedItems.length > 0 && (
        <div className="bg-gradient-to-r from-orange-900/50 to-amber-900/50 rounded-lg p-4 border border-orange-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold">
                {selectedItems.length}
              </div>
              <div>
                <p className="text-white font-medium">Songs Selected</p>
                <p className="text-gray-400 text-xs">Ready to save as playlist</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onClearSelection}
                className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm transition-all"
              >
                Clear
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-4 py-1.5 rounded bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white text-sm font-medium transition-all"
              >
                💾 Save Playlist
              </button>
            </div>
          </div>
          
          {/* Selected items preview */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {selectedItems.slice(0, 6).map((item) => (
              <div key={item.id} className="flex-shrink-0 w-12 h-12 rounded overflow-hidden">
                <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {selectedItems.length > 6 && (
              <div className="flex-shrink-0 w-12 h-12 rounded bg-zinc-700 flex items-center justify-center text-white text-xs">
                +{selectedItems.length - 6}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md border border-zinc-700">
            <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent mb-4">Save Music Playlist</h3>
            
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name..."
              className="w-full px-4 py-3 rounded-lg bg-black text-white placeholder-gray-400 border border-zinc-700 focus:border-orange-500 focus:outline-none"
              autoFocus
            />
            
            <p className="text-gray-400 text-sm mt-2">
              {selectedItems.length} songs will be saved
            </p>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!playlistName.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-medium transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist sections - show relevant section based on active tab */}
      {activeTab === 'music' ? (
        <>
          {renderPlaylistSection('My Music Playlists', '🎵', musicPlaylists, 'music')}
          {podcastPlaylists.length > 0 && (
            <div className="opacity-50">
              {renderPlaylistSection('My Podcast Series', '🎙️', podcastPlaylists, 'podcast')}
            </div>
          )}
        </>
      ) : (
        <>
          {renderPlaylistSection('My Podcast Series', '🎙️', podcastPlaylists, 'podcast')}
          {musicPlaylists.length > 0 && (
            <div className="opacity-50">
              {renderPlaylistSection('My Music Playlists', '🎵', musicPlaylists, 'music')}
            </div>
          )}
        </>
      )}
    </div>
  );
};
