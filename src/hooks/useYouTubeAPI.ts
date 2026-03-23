import { useState, useCallback } from 'react';
import { VideoItem, PlaylistSearchItem, YouTubeSearchResult, YouTubePlaylistItemResult } from '../types';

export const useYouTubeAPI = (apiKeys: string[]) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);

  const getCurrentKey = useCallback(() => {
    if (apiKeys.length === 0) return null;
    return apiKeys[currentKeyIndex] || apiKeys[0];
  }, [apiKeys, currentKeyIndex]);

  const rotateKey = useCallback(() => {
    if (apiKeys.length > 1) {
      setCurrentKeyIndex((prev) => (prev + 1) % apiKeys.length);
    }
  }, [apiKeys.length]);

  // Search for music videos
  const searchMusic = useCallback(async (query: string): Promise<VideoItem[]> => {
    const apiKey = getCurrentKey();
    if (!apiKey) {
      setError('Please set your YouTube API key in settings');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const searchQuery = `${query} official audio OR official music OR lyrics`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=10&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        // If quota exceeded or error, try next key
        if (data.error.code === 429 || data.error.message?.includes('quota')) {
          rotateKey();
          if (apiKeys.length > 1) {
            setError('API quota exceeded. Trying next key...');
          } else {
            throw new Error(data.error.message);
          }
          return [];
        }
        throw new Error(data.error.message);
      }

      const results: VideoItem[] = data.items
        .filter((item: YouTubeSearchResult) => item.id.videoId)
        .map((item: YouTubeSearchResult) => ({
          id: item.id.videoId!,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
          channelTitle: item.snippet.channelTitle,
        }));

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getCurrentKey, rotateKey, apiKeys.length]);

  // Search for podcast playlists
  const searchPodcastPlaylists = useCallback(async (query: string): Promise<PlaylistSearchItem[]> => {
    const apiKey = getCurrentKey();
    if (!apiKey) {
      setError('Please set your YouTube API key in settings');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const searchQuery = `${query} podcast playlist OR podcast series OR podcast episodes`;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery)}&type=playlist&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        if (data.error.code === 429 || data.error.message?.includes('quota')) {
          rotateKey();
          if (apiKeys.length > 1) {
            setError('API quota exceeded. Trying next key...');
          } else {
            throw new Error(data.error.message);
          }
          return [];
        }
        throw new Error(data.error.message);
      }

      // Get playlist details to get item counts
      const playlistIds = data.items
        .filter((item: YouTubeSearchResult) => item.id.playlistId)
        .map((item: YouTubeSearchResult) => item.id.playlistId)
        .join(',');

      let itemCounts: Record<string, number> = {};
      
      if (playlistIds) {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id=${playlistIds}&key=${apiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        
        if (detailsData.items) {
          detailsData.items.forEach((item: { id: string; contentDetails: { itemCount: number } }) => {
            itemCounts[item.id] = item.contentDetails.itemCount;
          });
        }
      }

      const results: PlaylistSearchItem[] = data.items
        .filter((item: YouTubeSearchResult) => item.id.playlistId)
        .map((item: YouTubeSearchResult) => ({
          id: item.id.playlistId!,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
          channelTitle: item.snippet.channelTitle,
          itemCount: itemCounts[item.id.playlistId!] || 0,
          description: item.snippet.description,
        }));

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getCurrentKey, rotateKey, apiKeys.length]);

  // Get all videos from a playlist
  const getPlaylistItems = useCallback(async (playlistId: string): Promise<VideoItem[]> => {
    const apiKey = getCurrentKey();
    if (!apiKey) {
      setError('Please set your YouTube API key in settings');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const allItems: VideoItem[] = [];
      let nextPageToken = '';

      // Fetch up to 50 items (can be extended with pagination)
      do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          if (data.error.code === 429 || data.error.message?.includes('quota')) {
            rotateKey();
            if (apiKeys.length > 1) {
              setError('API quota exceeded. Trying next key...');
            } else {
              throw new Error(data.error.message);
            }
            return [];
          }
          throw new Error(data.error.message);
        }

        const items: VideoItem[] = data.items
          .filter((item: YouTubePlaylistItemResult) => item.snippet.resourceId?.videoId)
          .map((item: YouTubePlaylistItemResult) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            channelTitle: item.snippet.channelTitle,
          }));

        allItems.push(...items);
        nextPageToken = data.nextPageToken || '';
      } while (nextPageToken && allItems.length < 100); // Limit to 100 items

      return allItems;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get playlist items');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getCurrentKey, rotateKey, apiKeys.length]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchMusic,
    searchPodcastPlaylists,
    getPlaylistItems,
    loading,
    error,
    clearError,
  };
};
