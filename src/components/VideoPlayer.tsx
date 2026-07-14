'use client';

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  options: any;
  onReady?: (player: Player) => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ options, onReady, className = '' }) => {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      // Apply video.js classes + our custom classes
      videoElement.classList.add('vjs-big-play-centered');
      videoElement.classList.add('vjs-fluid');
      
      videoRef.current?.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, options, () => {
        videojs.log('player is ready');
        if (onReady) {
          onReady(player);
        }
      });
    } else {
      // You could update an existing player in the `else` block here
      // on prop change, for example:
      const player = playerRef.current;
      if (options.sources) {
        player.src(options.sources);
      }
    }
  }, [options, videoRef, onReady]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <div data-vjs-player className={`rounded-xl overflow-hidden shadow-sm border border-slate-200 ${className}`}>
      <div ref={videoRef} />
    </div>
  );
};

export default VideoPlayer;
