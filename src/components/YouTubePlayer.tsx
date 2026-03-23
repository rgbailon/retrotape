import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  volume: number;
  onProgress: (current: number, duration: number) => void;
  onEnded: () => void;
  onError?: () => void;
}

export interface YouTubePlayerHandle {
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string;
          width: string;
          videoId: string;
          playerVars: Record<string, number | string>;
          events: {
            onReady: (event: { target: YTPlayer }) => void;
            onStateChange: (event: { data: number; target: YTPlayer }) => void;
            onError: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(({
  videoId,
  isPlaying,
  volume,
  onProgress,
  onEnded,
  onError,
}, ref) => {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const apiReadyRef = useRef(false);

  // Expose seekTo and setVolume methods via ref
  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (playerRef.current) {
        playerRef.current.seekTo(time, true);
      }
    },
    setVolume: (vol: number) => {
      if (playerRef.current) {
        playerRef.current.setVolume(vol);
      }
    },
  }), []);

  // Handle volume changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = window.setInterval(() => {
      if (playerRef.current) {
        try {
          const current = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (!isNaN(current) && !isNaN(duration)) {
            onProgress(current, duration);
          }
        } catch {
          // Player might not be ready
        }
      }
    }, 500);
  }, [onProgress]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const createPlayer = useCallback((vidId: string) => {
    if (!containerRef.current) return;

    // Destroy existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        // Ignore errors
      }
      playerRef.current = null;
    }

    // Create container div
    const containerId = 'yt-player-' + Date.now();
    const playerDiv = document.createElement('div');
    playerDiv.id = containerId;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(playerDiv);

    playerRef.current = new window.YT.Player(containerId, {
      height: '0',
      width: '0',
      videoId: vidId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
        host: 'https://www.youtube.com',
      },
      events: {
        onReady: (event) => {
          event.target.setVolume(volume);
          // Don't auto-play here, let the isPlaying effect handle it
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            stopProgressTracking();
            onEnded();
          } else if (event.data === window.YT.PlayerState.PLAYING) {
            startProgressTracking();
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            stopProgressTracking();
          }
        },
        onError: () => {
          stopProgressTracking();
          onError?.();
        },
      },
    });
  }, [startProgressTracking, stopProgressTracking, onEnded, onError, volume]);

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true;
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true;
      if (videoId && currentVideoIdRef.current !== videoId) {
        currentVideoIdRef.current = videoId;
        createPlayer(videoId);
      }
    };

    return () => {
      stopProgressTracking();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Handle video changes - load new video without recreating player
  useEffect(() => {
    if (!videoId) {
      stopProgressTracking();
      return;
    }

    if (currentVideoIdRef.current === videoId) {
      return;
    }

    currentVideoIdRef.current = videoId;

    if (playerRef.current && apiReadyRef.current) {
      // Player exists, just load the new video
      try {
        playerRef.current.loadVideoById(videoId);
      } catch {
        // If load fails, create new player
        createPlayer(videoId);
      }
    } else if (apiReadyRef.current || (window.YT && window.YT.Player)) {
      createPlayer(videoId);
    }
  }, [videoId, createPlayer, stopProgressTracking]);

  // Track if we need to auto-play after video loads
  const shouldAutoPlayRef = useRef(false);
  
  // Handle play/pause - immediate response
  useEffect(() => {
    if (!playerRef.current) {
      // If player not ready yet, mark that we should auto-play when ready
      if (isPlaying) {
        shouldAutoPlayRef.current = true;
      }
      return;
    }

    shouldAutoPlayRef.current = false;

    try {
      const state = playerRef.current.getPlayerState();
      
      if (isPlaying) {
        if (state === window.YT.PlayerState.PLAYING) {
          return; // Already playing
        }
        playerRef.current.playVideo();
        startProgressTracking();
      } else {
        playerRef.current.pauseVideo();
        stopProgressTracking();
      }
    } catch {
      // Player not ready
    }
  }, [isPlaying, startProgressTracking, stopProgressTracking]);

  // Auto-play when player becomes ready if we should be playing
  useEffect(() => {
    if (!playerRef.current) return;
    
    const handleReady = () => {
      if (shouldAutoPlayRef.current && isPlaying) {
        try {
          playerRef.current?.playVideo();
          startProgressTracking();
          shouldAutoPlayRef.current = false;
        } catch {
          // Ignore
        }
      }
    };
    
    // Check immediately
    handleReady();
    
    // Also check after a short delay in case player state wasn't ready yet
    const timer = setTimeout(handleReady, 300);
    return () => clearTimeout(timer);
  }, [isPlaying, startProgressTracking]);

  return (
    <div 
      ref={containerRef} 
      className="absolute -left-[9999px] w-0 h-0 overflow-hidden"
      aria-hidden="true"
    />
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';
