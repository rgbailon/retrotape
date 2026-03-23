import React, { useState, useCallback, useRef } from 'react';
import { VideoItem, Playlist, PlayerState, PlaylistSearchItem, SearchTab } from './types';
import { useYouTubeAPI } from './hooks/useYouTubeAPI';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CassettePlayer } from './components/CassettePlayer';
import { WalkmanPlayer } from './components/WalkmanPlayer';
import { SettingsModal } from './components/SettingsModal';
import { SearchResults } from './components/SearchResults';
import { PlaylistManager } from './components/PlaylistManager';
import { YouTubePlayer, YouTubePlayerHandle } from './components/YouTubePlayer';

const App: React.FC = () => {
  // Settings & API
  const [apiKeys, setApiKeys] = useLocalStorage<string[]>('youtube-api-keys', []);
  const [showSettings, setShowSettings] = useState(false);
  const [playerStyle, setPlayerStyle] = useLocalStorage<'cassette' | 'walkman'>('player-style', 'cassette');
  
  // Volume state - saved in localStorage
  const [volume, setVolume] = useLocalStorage<number>('player-volume', 75);
  
  // Search state
  const [activeTab, setActiveTab] = useState<SearchTab>('music');
  const [searchQuery, setSearchQuery] = useState('');
  const [musicResults, setMusicResults] = useState<VideoItem[]>([]);
  const [podcastResults, setPodcastResults] = useState<PlaylistSearchItem[]>([]);
  const [selectedMusicItems, setSelectedMusicItems] = useState<VideoItem[]>([]);
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | undefined>();
  
  // Playlists
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('saved-playlists', []);
  
  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentPlaylist: null,
    currentIndex: 0,
    progress: 0,
    duration: 0,
  });
  
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  
  // YouTube API
  const { searchMusic, searchPodcastPlaylists, getPlaylistItems, loading, error, clearError } = useYouTubeAPI(apiKeys);

  // Search handlers
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    clearError();
    
    if (activeTab === 'music') {
      const results = await searchMusic(searchQuery);
      setMusicResults(results);
    } else {
      const results = await searchPodcastPlaylists(searchQuery);
      setPodcastResults(results);
    }
  };

  // Play a single music track from search results
  const handlePlayMusicTrack = useCallback((item: VideoItem) => {
    const tempPlaylist: Playlist = {
      id: `temp-${item.id}`,
      name: 'Now Playing',
      type: 'music',
      items: [item],
      createdAt: Date.now(),
    };
    
    setPlayerState({
      isPlaying: true,
      currentPlaylist: tempPlaylist,
      currentIndex: 0,
      progress: 0,
      duration: 0,
    });
  }, []);

  // Add music track to selection
  const handleAddToSelection = useCallback((item: VideoItem) => {
    setSelectedMusicItems(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  // Add podcast playlist to saved playlists
  const handleAddPodcastPlaylist = useCallback(async (playlistInfo: PlaylistSearchItem) => {
    setLoadingPlaylistId(playlistInfo.id);
    
    try {
      const items = await getPlaylistItems(playlistInfo.id);
      
      if (items.length > 0) {
        const newPlaylist: Playlist = {
          id: `podcast-${playlistInfo.id}-${Date.now()}`,
          name: playlistInfo.title,
          type: 'podcast',
          items,
          createdAt: Date.now(),
        };
        
        setPlaylists(prev => [newPlaylist, ...prev]);
      }
    } finally {
      setLoadingPlaylistId(undefined);
    }
  }, [getPlaylistItems, setPlaylists]);

  // Save music playlist
  const handleSavePlaylist = useCallback((name: string, items: VideoItem[], type: 'music' | 'podcast') => {
    const newPlaylist: Playlist = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      items,
      createdAt: Date.now(),
    };
    setPlaylists(prev => [newPlaylist, ...prev]);
  }, [setPlaylists]);

  // Play a saved playlist
  const handlePlayPlaylist = useCallback((playlist: Playlist) => {
    setPlayerState({
      isPlaying: true,
      currentPlaylist: playlist,
      currentIndex: 0,
      progress: 0,
      duration: 0,
    });
  }, []);

  // Delete playlist
  const handleDeletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    if (playerState.currentPlaylist?.id === id) {
      setPlayerState({
        isPlaying: false,
        currentPlaylist: null,
        currentIndex: 0,
        progress: 0,
        duration: 0,
      });
    }
  }, [setPlaylists, playerState.currentPlaylist?.id]);

  // Player controls
  const handlePlayPause = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleNext = useCallback(() => {
    setPlayerState(prev => {
      if (!prev.currentPlaylist) return prev;
      const nextIndex = (prev.currentIndex + 1) % prev.currentPlaylist.items.length;
      return { ...prev, currentIndex: nextIndex, progress: 0 };
    });
  }, []);

  const handlePrevious = useCallback(() => {
    setPlayerState(prev => {
      if (!prev.currentPlaylist) return prev;
      const prevIndex = prev.currentIndex === 0 
        ? prev.currentPlaylist.items.length - 1 
        : prev.currentIndex - 1;
      return { ...prev, currentIndex: prevIndex, progress: 0 };
    });
  }, []);

  const handleStop = useCallback(() => {
    setPlayerState({
      isPlaying: false,
      currentPlaylist: null,
      currentIndex: 0,
      progress: 0,
      duration: 0,
    });
  }, []);

  const handleSeek = useCallback((time: number) => {
    playerRef.current?.seekTo(time);
    setPlayerState(prev => ({ ...prev, progress: time }));
  }, []);

  const handleProgress = useCallback((progress: number, duration: number) => {
    setPlayerState(prev => ({ ...prev, progress, duration }));
  }, []);

  const handleEnded = useCallback(() => {
    setPlayerState(prev => {
      if (!prev.currentPlaylist) return prev;
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.currentPlaylist.items.length) {
        // Playlist ended
        return { ...prev, isPlaying: false, currentIndex: 0, progress: 0 };
      }
      return { ...prev, currentIndex: nextIndex, progress: 0 };
    });
  }, []);

  const handleJumpToTrack = useCallback((index: number) => {
    setPlayerState(prev => ({
      ...prev,
      currentIndex: index,
      progress: 0,
      isPlaying: true,
    }));
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    playerRef.current?.setVolume(newVolume);
  }, [setVolume]);

  const currentTrack = playerState.currentPlaylist?.items[playerState.currentIndex];
  const currentlyPlayingId = currentTrack?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-sm border-b border-zinc-900 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📼</div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">RetroTape</h1>
                <p className="text-xs text-gray-400">YouTube Music & Podcast Player</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Player style toggle */}
              <button
                onClick={() => setPlayerStyle(playerStyle === 'cassette' ? 'walkman' : 'cassette')}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-all border border-zinc-700"
                title="Toggle player style"
              >
                {playerStyle === 'cassette' ? '📼 Cassette' : '📻 Walkman'}
              </button>
              
              {/* Settings button */}
              <button
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-full transition-all ${
                  apiKeys.length > 0 ? 'bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400' : 'bg-yellow-600 hover:bg-yellow-500 animate-pulse'
                }`}
                title={apiKeys.length > 0 ? 'Settings' : 'Set API Key'}
              >
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column - Player & Queue */}
          <div className="space-y-6">
            {/* Player */}
            {playerStyle === 'cassette' ? (
              <CassettePlayer
                currentTrack={currentTrack || null}
                isPlaying={playerState.isPlaying}
                progress={playerState.progress}
                duration={playerState.duration}
                volume={volume}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onStop={handleStop}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                playlistName={playerState.currentPlaylist?.name}
                playlistType={playerState.currentPlaylist?.type}
              />
            ) : (
              <WalkmanPlayer
                currentTrack={currentTrack || null}
                isPlaying={playerState.isPlaying}
                progress={playerState.progress}
                duration={playerState.duration}
                volume={volume}
                onPlayPause={handlePlayPause}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onStop={handleStop}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                playlistName={playerState.currentPlaylist?.name}
                playlistType={playerState.currentPlaylist?.type}
              />
            )}
            
            {/* Now Playing Queue */}
            {playerState.currentPlaylist && playerState.currentPlaylist.items.length > 1 && (
              <div className="bg-black/60 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span>{playerState.currentPlaylist.type === 'music' ? '🎵' : '🎙️'}</span>
                  <span>Now Playing Queue</span>
                  <span className="text-sm font-normal text-gray-400">
                    ({playerState.currentIndex + 1} / {playerState.currentPlaylist.items.length})
                  </span>
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {playerState.currentPlaylist.items.map((item, index) => (
                    <button
                      key={`${item.id}-${index}`}
                      onClick={() => handleJumpToTrack(index)}
                      className={`w-full flex items-center gap-2 p-2 rounded transition-all text-left ${
                        index === playerState.currentIndex
                          ? 'bg-gradient-to-r from-orange-600/50 to-yellow-500/50'
                          : 'hover:bg-zinc-700/50'
                      }`}
                    >
                      <span className={`w-6 text-center text-sm ${
                        index === playerState.currentIndex ? 'text-orange-400' : 'text-gray-500'
                      }`}>
                        {index === playerState.currentIndex ? (
                          playerState.isPlaying ? '▶' : '⏸'
                        ) : (
                          index < playerState.currentIndex ? '✓' : index + 1
                        )}
                      </span>
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-8 h-6 object-cover rounded"
                      />
                      <span className={`truncate text-sm ${
                        index === playerState.currentIndex ? 'text-white' : 'text-gray-400'
                      }`}>
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Playlists */}
            <PlaylistManager
              playlists={playlists}
              onSavePlaylist={handleSavePlaylist}
              onPlayPlaylist={handlePlayPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              selectedItems={selectedMusicItems}
              onClearSelection={() => setSelectedMusicItems([])}
              currentPlaylistId={playerState.currentPlaylist?.id}
              activeTab={activeTab}
            />
          </div>

          {/* Right column - Search & Results */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 bg-black/60 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => {
                  setActiveTab('music');
                  setSearchQuery('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'music'
                    ? 'bg-gradient-to-r from-orange-600 to-yellow-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-700/50'
                }`}
              >
                <span className="text-xl">🎵</span>
                <span>Music</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('podcast');
                  setSearchQuery('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'podcast'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-700/50'
                }`}
              >
                <span className="text-xl">🎙️</span>
                <span>Podcast</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={activeTab === 'music' ? 'Search for music...' : 'Search for podcast series...'}
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-zinc-900 text-white placeholder-gray-500 border border-zinc-800 focus:border-orange-500 focus:outline-none"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 disabled:from-gray-700 disabled:to-gray-600 text-white disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                ) : (
                  'Search'
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* No API key warning */}
            {apiKeys.length === 0 && (
              <div className="bg-amber-900/50 border border-amber-500 rounded-lg p-4 text-amber-200">
                <p className="font-medium">⚠️ API Key Required</p>
                <p className="text-sm mt-1">Please set your YouTube API key in settings to search for content.</p>
                <button
                  onClick={() => setShowSettings(true)}
                  className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-500 hover:to-yellow-400 rounded-lg text-white text-sm font-medium transition-all"
                >
                  Open Settings
                </button>
              </div>
            )}

            {/* Search Results */}
            {activeTab === 'music' && musicResults.length > 0 && (
              <SearchResults
                type="music"
                results={musicResults}
                onPlay={handlePlayMusicTrack}
                onAddToQueue={handleAddToSelection}
                currentlyPlaying={currentlyPlayingId}
                selectedItems={selectedMusicItems}
              />
            )}
            
            {activeTab === 'podcast' && podcastResults.length > 0 && (
              <SearchResults
                type="podcast"
                results={podcastResults}
                onAddPlaylist={handleAddPodcastPlaylist}
                loadingPlaylistId={loadingPlaylistId}
              />
            )}

            {/* Empty state */}
            {activeTab === 'music' && musicResults.length === 0 && !loading && apiKeys.length > 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-4">🎵</div>
                <p className="text-lg">Search for music to get started</p>
                <p className="text-sm mt-2">You can play tracks directly or add them to a playlist</p>
              </div>
            )}
            
            {activeTab === 'podcast' && podcastResults.length === 0 && !loading && apiKeys.length > 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-4">🎙️</div>
                <p className="text-lg">Search for podcast series</p>
                <p className="text-sm mt-2">Find and save entire podcast playlists to listen later</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Hidden YouTube Player */}
      {currentTrack && (
        <YouTubePlayer
          ref={playerRef}
          videoId={currentTrack.id}
          isPlaying={playerState.isPlaying}
          volume={volume}
          onProgress={handleProgress}
          onEnded={handleEnded}
          onError={() => {
            // Skip to next on error
            handleNext();
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          apiKeys={apiKeys}
          onSave={setApiKeys}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default App;
