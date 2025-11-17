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

  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const current = items[index];
  if (!current) return null;

  const duration = current.media.duration ?? (current.media.type === "image" ? DEFAULT_IMAGE_DURATION : 0);

  // Прелоад следующего медиа
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
      if (items[next]?.userId && items[next].userId !== current.userId) {
        onUserChange?.(items[next].userId);
      }
      return next;
    });
    setProgress(0);
    clearTimer();
  }, [items, loop, onClose, onUserChange, clearTimer]);

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i === 0) return 0;
      const prev = i - 1;
      if (items[prev]?.userId && items[prev].userId !== current.userId) {
        onUserChange?.(items[prev].userId);
      }
      return prev;
    });
    setProgress(0);
    clearTimer();
  }, [items, onUserChange, clearTimer]);

  // Обработка прогресса
  useEffect(() => {
    if (current.media.type === "video") {
      const video = videoRef.current;
      if (!video) return;

      const onTime = () => {
        if (video.duration && !isNaN(video.duration)) {
          setProgress(Math.min(1, video.currentTime / video.duration));
        }
      };
      const onEnded = () => goNext();

      video.addEventListener("timeupdate", onTime);
      video.addEventListener("ended", onEnded);

      if (!isPaused) video.play().catch(() => {});
      else video.pause();

      return () => {
        video.removeEventListener("timeupdate", onTime);
        video.removeEventListener("ended", onEnded);
      };
    } else {
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
    }
  }, [current, isPaused, goNext, duration, clearTimer]);

  // Hit zones: переключение кликами
  const handleZoneClick = (zone: "prev" | "toggle" | "next") => {
    if (zone === "prev") goPrev();
    if (zone === "next") goNext();
    if (zone === "toggle") setIsPaused(p => !p);
  };

  // Escape для выхода
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Render
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.user}>
            <img src={current.avatar} className={styles.avatar} />
            <div className={styles.username}>{current.username}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        <div className={styles.progressRow}>
          {(() => {
            const userId = current.userId;
            const indices = items.map((it, ii) => ({ it, ii }))
              .filter(x => x.it.userId === userId)
              .map(x => x.ii);

            return indices.map(ii => (
              <div key={ii} className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ transform: ii === index ? `scaleX(${progress})` : ii < index ? "scaleX(1)" : "scaleX(0)" }}
                />
              </div>
            ));
          })()}
        </div>

        <div className={styles.mediaArea}>
          {current.media.type === "image" ? (
            <img src={current.media.url} className={styles.mediaImage} draggable={false} />
          ) : (
            <video ref={videoRef} src={current.media.url} className={styles.mediaVideo} playsInline autoPlay muted={isMuted} preload="auto" />
          )}

        <div className={styles.hitZones}>

          {current.media.type === "video" && (
            <button
              className={styles.soundBtn}
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted((prev) => {
                  const newMuted = !prev;
                  if (videoRef.current) videoRef.current.muted = newMuted;
                  return newMuted;
                });
              }}
            >
              {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
          )}

          <button className={`${styles.zone} ${styles.left}`} onClick={() => handleZoneClick("prev")} />
          <button className={`${styles.zone} ${styles.center}`} onClick={() => handleZoneClick("toggle")} />
          <button className={`${styles.zone} ${styles.right}`} onClick={() => handleZoneClick("next")} />
        </div>

        </div>
      </div>
    </div>
  );
};

export default Stories;
