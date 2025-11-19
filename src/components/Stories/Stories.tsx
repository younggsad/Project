'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Stories.module.css";
import { Volume2, VolumeX } from "lucide-react";

export type StoryItem = {
  userId: number;
  username: string;
  avatar: string;
  media: { type: "image" | "video"; url: string; duration?: number };
};

type Props = {
  items: StoryItem[];
  startIndex: number;
  onClose: () => void;
  onUserChange?: (userId: number) => void;
  loop?: boolean;
};

const DEFAULT_IMAGE_DURATION = 5000;
const PROGRESS_TICK_MS = 50;

const Stories = ({ items, startIndex, onClose, onUserChange, loop = false }: Props) => {
  const [index, setIndex] = useState(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.05);

  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const current = items[index];
  if (!current) return null;

  const duration =
    current.media.duration ??
    (current.media.type === "image" ? DEFAULT_IMAGE_DURATION : 0);

  /** INIT VIDEO: APPLY DEFAULT VOLUME */
  useEffect(() => {
    if (current.media.type === "video" && videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [current]);

  /** Update volume/mute when user changes slider or mute btn */
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  /** Preload next content */
  useEffect(() => {
    const next = items[index + 1];
    if (!next) return;
    if (next.media.type === "image") {
      const img = new Image();
      img.src = next.media.url;
    }
  }, [index, items]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= items.length) {
        if (loop) {
          onUserChange?.(items[0].userId);
          return 0;
        } else {
          onClose();
          return i;
        }
      }
      if (items[next]?.userId !== current.userId) {
        onUserChange?.(items[next].userId);
      }
      return next;
    });

    setProgress(0);
    clearTimer();
  }, [items, loop, onClose, onUserChange, clearTimer, current.userId]);

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i === 0) return 0;
      const prev = i - 1;
      if (items[prev]?.userId !== current.userId) {
        onUserChange?.(items[prev].userId);
      }
      return prev;
    });

    setProgress(0);
    clearTimer();
  }, [items, onUserChange, clearTimer, current.userId]);

  /** Progress / autoplay */
  useEffect(() => {
    if (current.media.type === "video") {
      const v = videoRef.current;
      if (!v) return;

      const handleTime = () => {
        if (v.duration && !isNaN(v.duration)) {
          setProgress(Math.min(1, v.currentTime / v.duration));
        }
      };

      const handleEnd = () => goNext();

      v.addEventListener("timeupdate", handleTime);
      v.addEventListener("ended", handleEnd);

      if (!isPaused) v.play().catch(() => {});
      else v.pause();

      return () => {
        v.removeEventListener("timeupdate", handleTime);
        v.removeEventListener("ended", handleEnd);
      };
    }

    // IMAGES
    let elapsed = 0;
    if (!isPaused) {
      timerRef.current = window.setInterval(() => {
        elapsed += PROGRESS_TICK_MS;
        setProgress(Math.min(1, elapsed / duration));
        if (elapsed >= duration) {
          clearTimer();
          goNext();
        }
      }, PROGRESS_TICK_MS);
    }

    return () => clearTimer();
  }, [current, isPaused, goNext, duration, clearTimer]);

  /** Click zones */
  const handleZoneClick = (zone: "prev" | "toggle" | "next") => {
    if (zone === "prev") goPrev();
    if (zone === "next") goNext();
    if (zone === "toggle") setIsPaused((p) => !p);
  };

  /** Escape exit */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>

        {/* HEADER */}
        <header className={styles.header}>
          <div className={styles.user}>
            <img src={current.avatar} className={styles.avatar} />
            <div className={styles.username}>{current.username}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        {/* PROGRESS */}
        <div className={styles.progressRow}>
          {(() => {
            const userId = current.userId;
            const indices = items
              .map((it, ii) => ({ it, ii }))
              .filter(x => x.it.userId === userId)
              .map(x => x.ii);

            return indices.map(ii => (
              <div key={ii} className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    transform:
                      ii === index
                        ? `scaleX(${progress})`
                        : ii < index
                        ? "scaleX(1)"
                        : "scaleX(0)"
                  }}
                />
              </div>
            ));
          })()}
        </div>

        {/* MEDIA */}
        <div className={styles.mediaArea}>
          {current.media.type === "image" ? (
            <img src={current.media.url} className={styles.mediaImage} draggable={false} />
          ) : (
            <video
              ref={videoRef}
              src={current.media.url}
              className={styles.mediaVideo}
              playsInline
              autoPlay
              muted={isMuted}
              preload="auto"
            />
          )}

          {/* HIT ZONES */}
          <div className={styles.hitZones}>
            <button className={`${styles.zone} ${styles.left}`} onClick={() => handleZoneClick("prev")} />
            <button className={`${styles.zone} ${styles.center}`} onClick={() => handleZoneClick("toggle")} />
            <button className={`${styles.zone} ${styles.right}`} onClick={() => handleZoneClick("next")} />
          </div>

          {/* CONTROLS LEFT: MUTE BUTTON + VOLUME SLIDER */}
          <div className={styles.controlsLeft}>
            {current.media.type === "video" && (
              <>
                <button
                  className={styles.soundBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(v => !v);
                  }}
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    if (v > 0 && isMuted) setIsMuted(false);
                  }}
                  className={styles.volumeSlider}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stories;
