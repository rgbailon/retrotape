export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
}

export interface PlaylistSearchItem {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  itemCount: number;
  description: string;
}

export interface Playlist {
  id: string;
  name: string;
  type: 'music' | 'podcast';
  items: VideoItem[];
  createdAt: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentPlaylist: Playlist | null;
  currentIndex: number;
  progress: number;
  duration: number;
}

export interface YouTubeSearchResult {
  id: {
    videoId?: string;
    playlistId?: string;
    kind: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
  };
}

export interface YouTubePlaylistItemResult {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    channelTitle: string;
    resourceId: {
      videoId: string;
    };
  };
}

export type SearchTab = 'music' | 'podcast';
