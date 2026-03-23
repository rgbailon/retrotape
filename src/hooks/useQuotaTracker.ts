import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface QuotaUsage {
  used: number;
  lastUpdated: number;
}

interface QuotaData {
  [apiKey: string]: QuotaUsage;
}

const DAILY_QUOTA = 10000;
const QUOTA_THRESHOLD = 9600; // Switch key before hitting limit
const STORAGE_KEY = 'youtube-api-quota';
const PT_OFFSET = -8; // Pacific Time offset from UTC

interface UseQuotaTrackerReturn {
  getQuotaUsage: (apiKey: string) => { used: number; remaining: number; percentage: number };
  recordUsage: (apiKey: string, units: number) => void;
  shouldSwitchKey: (apiKey: string) => boolean;
  getNextResetTime: () => { hours: number; minutes: number; seconds: number; isResetToday: boolean };
  getAllUsage: () => { key: string; used: number; remaining: number; percentage: number }[];
  resetQuota: (apiKey: string) => void;
}

export const useQuotaTracker = (): UseQuotaTrackerReturn => {
  const [quotaData, setQuotaData] = useLocalStorage<QuotaData>(STORAGE_KEY, {});
  const lastResetRef = useRef<string>(getDateKey());

  // Get current date key (YYYY-MM-DD in Pacific Time)
  function getDateKey(): string {
    const now = new Date();
    const ptDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    return `${ptDate.getFullYear()}-${String(ptDate.getMonth() + 1).padStart(2, '0')}-${String(ptDate.getDate()).padStart(2, '0')}`;
  }

  // Check and reset quota if day has changed
  useEffect(() => {
    const currentDateKey = getDateKey();
    if (lastResetRef.current !== currentDateKey) {
      // New day - reset all quotas
      setQuotaData({});
      lastResetRef.current = currentDateKey;
    }
  }, [setQuotaData]);

  // Get quota usage for a specific key
  const getQuotaUsage = useCallback((apiKey: string) => {
    const keyData = quotaData[apiKey] || { used: 0, lastUpdated: Date.now() };
    return {
      used: keyData.used,
      remaining: Math.max(0, DAILY_QUOTA - keyData.used),
      percentage: Math.min(100, (keyData.used / DAILY_QUOTA) * 100),
    };
  }, [quotaData]);

  // Record API usage
  const recordUsage = useCallback((apiKey: string, units: number) => {
    setQuotaData(prev => {
      const currentUsed = prev[apiKey]?.used || 0;
      const newUsed = currentUsed + units;
      return {
        ...prev,
        [apiKey]: {
          used: Math.min(newUsed, DAILY_QUOTA),
          lastUpdated: Date.now(),
        },
      };
    });
  }, [setQuotaData]);

  // Check if should switch to a different key
  const shouldSwitchKey = useCallback((apiKey: string) => {
    const usage = getQuotaUsage(apiKey);
    return usage.used >= QUOTA_THRESHOLD;
  }, [getQuotaUsage]);

  // Get time until next reset (midnight PT)
  const getNextResetTime = useCallback(() => {
    const now = new Date();
    const ptNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    const midnight = new Date(ptNow);
    midnight.setHours(24, 0, 0, 0);
    
    const diff = midnight.getTime() - ptNow.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return {
      hours,
      minutes,
      seconds,
      isResetToday: false,
    };
  }, []);

  // Get usage for all keys
  const getAllUsage = useCallback(() => {
    return Object.keys(quotaData).map(key => {
      const usage = getQuotaUsage(key);
      return {
        key: key.substring(0, 8) + '...' + key.substring(key.length - 4),
        used: usage.used,
        remaining: usage.remaining,
        percentage: usage.percentage,
      };
    });
  }, [quotaData, getQuotaUsage]);

  // Reset quota for a specific key
  const resetQuota = useCallback((apiKey: string) => {
    setQuotaData(prev => ({
      ...prev,
      [apiKey]: { used: 0, lastUpdated: Date.now() },
    }));
  }, [setQuotaData]);

  return {
    getQuotaUsage,
    recordUsage,
    shouldSwitchKey,
    getNextResetTime,
    getAllUsage,
    resetQuota,
  };
};
