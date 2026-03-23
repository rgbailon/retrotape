import { useState, useCallback, useEffect } from 'react';
import { VideoItem, PlaylistSearchItem, YouTubeSearchResult, YouTubePlaylistItemResult } from '../types';
import { useQuotaTracker } from './useQuotaTracker';

const QUOTA_THRESHOLD = 9600;

interface UseYouTubeAPIReturn {
  searchMusic: (query: string) => Promise<PlaylistSearchItem[]>;
  searchPodcastPlaylists: (query: string) => Promise<PlaylistSearchItem[]>;
  getPlaylistItems: (playlistId: string) => Promise<VideoItem[]>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  quotaInfo: {
    currentKey: string;
    used: number;
    remaining: number;
    percentage: number;
    allKeys: { key: string; used: number; remaining: number; percentage: number }[];
    nextReset: { hours: number; minutes: number; seconds: number; isResetToday: boolean };
  };
}

export const useYouTubeAPI = (apiKeys: string[]): UseYouTubeAPIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const { getQuotaUsage, recordUsage, shouldSwitchKey, getNextResetTime, getAllUsage } = useQuotaTracker();

  // Find the first available key that hasn't exceeded threshold
  const findAvailableKey = useCallback(() => {
    for (let i = 0; i < apiKeys.length; i++) {
      const key = apiKeys[i];
      if (!shouldSwitchKey(key)) {
        return i;
      }
    }
    // All keys are exhausted, return first one anyway
    return 0;
  }, [apiKeys, shouldSwitchKey]);

  // Auto-select first available key on mount and when keys change
  useEffect(() => {
    if (apiKeys.length > 0) {
      const availableIndex = findAvailableKey();
      setCurrentKeyIndex(availableIndex);
    }
  }, [apiKeys, findAvailableKey]);

  const getCurrentKey = useCallback(() => {
    if (apiKeys.length === 0) return null;
    return apiKeys[currentKeyIndex] || apiKeys[0];
  }, [apiKeys, currentKeyIndex]);

  const rotateKey = useCallback(() => {
    if (apiKeys.length > 1) {
      const currentKey = getCurrentKey();
      if (currentKey) {
        recordUsage(currentKey, QUOTA_THRESHOLD); // Mark current key as exhausted
      }
      
      // Find next available key
      let nextIndex = (currentKeyIndex + 1) % apiKeys.length;
      let attempts = 0;
      while (shouldSwitchKey(apiKeys[nextIndex]) && attempts < apiKeys.length) {
        nextIndex = (nextIndex + 1) % apiKeys.length;
        attempts++;
      }
      setCurrentKeyIndex(nextIndex);
    }
  }, [apiKeys, currentKeyIndex, getCurrentKey, shouldSwitchKey, recordUsage]);

  // Check quota before making request and switch if needed
  const checkAndRotate = useCallback(() => {
    const currentKey = getCurrentKey();
    if (currentKey && shouldSwitchKey(currentKey)) {
      rotateKey();
      return true;
    }
    return false;
  }, [getCurrentKey, shouldSwitchKey, rotateKey]);

  // Make API request with automatic quota tracking
  const makeRequest = useCallback(async <T>(
    url: string,
    unitsCost: number,
    onSuccess: (data: any) => T,
    onError?: (error: string) => void
  ): Promise<T | null> => {
    const currentKey = getCurrentKey();
    if (!currentKey) {
      setError('Please set your YouTube API key in settings');
      return null;
    }

    // Check if we need to switch before making request
    checkAndRotate();

    setLoading(true);
    setError(null);

    try {
      const finalUrl = url.replace(/key=[^&]+/, `key=${currentKey}`);
      const response = await fetch(finalUrl);
      const data = await response.json();

      if (data.error) {
        if (data.error.code === 429 || data.error.message?.includes('quota')) {
          recordUsage(currentKey, QUOTA_THRESHOLD);
          rotateKey();
          if (apiKeys.length > 1) {
            setError('API quota exceeded. Using next key...');
          } else {
            setError('API quota exceeded for today.');
          }
          return null;
        }
        throw new Error(data.error.message);
      }

      // Record successful usage
      recordUsage(currentKey, unitsCost);

      // Check if we're approaching quota after this request
      const usage = getQuotaUsage(currentKey);
      if (usage.used >= QUOTA_THRESHOLD && apiKeys.length > 1) {
        rotateKey();
      }

      return onSuccess(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getCurrentKey, checkAndRotate, recordUsage, rotateKey, getQuotaUsage, apiKeys.length]);

  // Search for music playlists (100 units per search + extra for details)
  const searchMusic = useCallback(async (query: string): Promise<PlaylistSearchItem[]> => {
    const searchQuery = `${query} playlist`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery)}&type=playlist&key=demo`;
    
    const result = await makeRequest(
      url,
      100,
      (data) => data,
      () => {}
    );

    if (!result) return [];

    const playlistIds = result.items
      .filter((item: YouTubeSearchResult) => item.id.playlistId)
      .map((item: YouTubeSearchResult) => item.id.playlistId)
      .join(',');

    let itemCounts: Record<string, number> = {};
    
    if (playlistIds) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id=${playlistIds}&key=demo`;
      await makeRequest(
        detailsUrl,
        result.items.length,
        (detailsData) => {
          if (detailsData.items) {
            detailsData.items.forEach((item: { id: string; contentDetails: { itemCount: number } }) => {
              itemCounts[item.id] = item.contentDetails.itemCount;
            });
          }
          return detailsData;
        }
      );
    }

    return result.items
      .filter((item: YouTubeSearchResult) => item.id.playlistId)
      .map((item: YouTubeSearchResult) => ({
        id: item.id.playlistId!,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        itemCount: itemCounts[item.id.playlistId!] || 0,
        description: item.snippet.description,
      }));
  }, [makeRequest]);

  // Search for podcast playlists (100 units per search + extra for details)
  const searchPodcastPlaylists = useCallback(async (query: string): Promise<PlaylistSearchItem[]> => {
    const searchQuery = `${query} podcast playlist OR podcast series OR podcast episodes`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery)}&type=playlist&key=demo`;
    
    const result = await makeRequest(
      url,
      100,
      (data) => data,
      () => {}
    );

    if (!result) return [];

    // Get playlist details
    const playlistIds = result.items
      .filter((item: YouTubeSearchResult) => item.id.playlistId)
      .map((item: YouTubeSearchResult) => item.id.playlistId)
      .join(',');

    let itemCounts: Record<string, number> = {};
    
    if (playlistIds) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=contentDetails&id=${playlistIds}&key=demo`;
      await makeRequest(
        detailsUrl,
        result.items.length,
        (detailsData) => {
          if (detailsData.items) {
            detailsData.items.forEach((item: { id: string; contentDetails: { itemCount: number } }) => {
              itemCounts[item.id] = item.contentDetails.itemCount;
            });
          }
          return detailsData;
        }
      );
    }

    return result.items
      .filter((item: YouTubeSearchResult) => item.id.playlistId)
      .map((item: YouTubeSearchResult) => ({
        id: item.id.playlistId!,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        itemCount: itemCounts[item.id.playlistId!] || 0,
        description: item.snippet.description,
      }));
  }, [makeRequest]);

  // Get all videos from a playlist (1 unit per item)
  const getPlaylistItems = useCallback(async (playlistId: string): Promise<VideoItem[]> => {
    const allItems: VideoItem[] = [];
    let nextPageToken = '';
    let totalUnits = 0;
    const maxItems = 100;

    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=demo${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const result = await makeRequest(
        url,
        50,
        (data) => data,
        () => {}
      );

      if (!result) break;

      const items: VideoItem[] = result.items
        .filter((item: YouTubePlaylistItemResult) => item.snippet.resourceId?.videoId)
        .map((item: YouTubePlaylistItemResult) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
          channelTitle: item.snippet.channelTitle,
        }));

      allItems.push(...items);
      totalUnits += result.items.length;
      nextPageToken = result.nextPageToken || '';
    } while (nextPageToken && allItems.length < maxItems);

    return allItems;
  }, [makeRequest]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Build quota info for UI
  const currentKey = getCurrentKey();
  const quotaInfo = {
    currentKey: currentKey ? `${currentKey.substring(0, 8)}...${currentKey.substring(currentKey.length - 4)}` : '',
    used: currentKey ? getQuotaUsage(currentKey).used : 0,
    remaining: currentKey ? getQuotaUsage(currentKey).remaining : 0,
    percentage: currentKey ? getQuotaUsage(currentKey).percentage : 0,
    allKeys: getAllUsage(),
    nextReset: getNextResetTime(),
  };

  return {
    searchMusic,
    searchPodcastPlaylists,
    getPlaylistItems,
    loading,
    error,
    clearError,
    quotaInfo,
  };
};
