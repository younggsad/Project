'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Stories.module.css";

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
  const [index, setIndex] = useState<number>(startIndex);
  const current = items[index];
  const duration = current?.media?.duration ?? (current?.media?.type === "image" ? DEFAULT_IMAGE_DURATION : DEFAULT_IMAGE_DURATION);

    // Guard: если items пустой или index вне диапазона
  if (!items || items.length === 0 || index < 0 || index >= items.length) {
    return null;
  }

  if (!current) return null;

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Ensure index follows startIndex if it changes externally
  useEffect(() => setIndex(startIndex), [startIndex]);

  // Preload next item
  useEffect(() => {
    const next = items[index + 1];
    if (!next) return;
    if (next.media.type === "image") {
      const img = new Image();
      img.src = next.media.url;
    } else {
      const v = document.createElement("video");
      v.src = next.media.url;
      v.preload = "auto";
    }
  }, [index, items]);

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Move to next index (functional update to avoid stale closures)
  const goNext = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= items.length) {
        // reached end
        if (loop) {
          // wrap
          onUserChange?.(items[0].userId);
          return 0;
        } else {
          onClose();
          return i;
        }
      }
      // if user changes, notify parent
      if (items[next].userId !== items[i].userId) {
        onUserChange?.(items[next].userId);
      }
      return next;
    });
    setProgress(0);
    clearTimer();
  }, [items, loop, onClose, onUserChange, clearTimer]);

  // Move previous
  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i === 0) return 0;
      const prev = i - 1;
      if (items[prev].userId !== items[i].userId) {
        onUserChange?.(items[prev].userId);
      }
      return prev;
    });
    setProgress(0);
    clearTimer();
  }, [items, onUserChange, clearTimer]);

  // Progress handling: if video -> listen to timeupdate; if image -> use interval
  useEffect(() => {
    if (!current) return;
    setProgress(0);
    clearTimer();

    if (current.media.type === "video") {
      // ensure videoRef points to the right element by id
      // We'll use a dynamic src videoRef (the element is rendered below with ref)
      const video = videoRef.current;
      if (video) {
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
        // fallback: auto advance after duration if video element not mounted
        const t = window.setTimeout(() => goNext(), duration);
        return () => clearTimeout(t);
      }
    } else {
      // image
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
      return () => {
        clearTimer();
      };
    }
  }, [current, isPaused, goNext, duration, clearTimer]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  // Pointer zones handlers (pause on down, unpause and decide on up)
  useEffect(() => {
    const el = document.getElementById("stories-root");
    if (!el) return;

    let startX = 0;
    let startTime = 0;

    const onPointerDown = (ev: PointerEvent) => {
      startX = ev.clientX;
      startTime = Date.now();
      setIsPaused(true);
      clearTimer();
      // pause video if exists
      if (videoRef.current) videoRef.current.pause();
    };

    const onPointerUp = (ev: PointerEvent) => {
      const dt = Date.now() - startTime;
      const dx = ev.clientX - startX;
      setIsPaused(false);
      if (videoRef.current && !isNaN(videoRef.current.duration)) {
        // resume video play if it's a video
        if (current.media.type === "video") videoRef.current.play().catch(() => {});
      }
      if (dt < 300 && Math.abs(dx) < 30) {
        const rect = el.getBoundingClientRect();
        if (ev.clientX - rect.left < rect.width / 3) goPrev();
        else if (ev.clientX - rect.left > (rect.width * 2) / 3) goNext();
        else setIsPaused((p) => !p);
      } else {
        // resume timer if image
        if (current.media.type === "image" && !isPaused) {
          // restarting handled by effect because isPaused changed
        }
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [goPrev, goNext, clearTimer, current, isPaused]);

  // render
  if (!current) return null;

  return (
    <div className={styles.overlay}>
      <div id="stories-root" className={styles.container}>
        <header className={styles.header}>
          <div className={styles.user}>
            <img src={current.avatar} className={styles.avatar} />
            <div className={styles.username}>{current.username}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        <div className={styles.progressRow}>
          {/* show progress for current user's media chunk:
            find all indices for current.userId and render segments
          */}
          { /* compute segments for current user */}
          {(() => {
            const userId = current.userId;
            const indices = items
              .map((it, ii) => ({ it, ii }))
              .filter((x) => x.it.userId === userId)
              .map((x) => x.ii);

            return indices.map((ii, pos) => (
              <div key={ii} className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{
                    transform:
                      ii === index ? `scaleX(${progress})` : ii < index ? "scaleX(1)" : "scaleX(0)",
                  }}
                />
              </div>
            ));
          })()}
        </div>

        <div className={styles.mediaArea}>
          {current.media.type === "image" ? (
            // image
            <img src={current.media.url} className={styles.mediaImage} draggable={false} />
          ) : (
            // video
            <video
              ref={videoRef}
              src={current.media.url}
              className={styles.mediaVideo}
              playsInline
              preload="auto"
              autoPlay
              muted
            />
          )}

          {/* zones */}
          <div className={styles.hitZones}>
            <button aria-label="prev" className={`${styles.zone} ${styles.left}`} onClick={goPrev} />
            <button aria-label="toggle" className={`${styles.zone} ${styles.center}`} onClick={() => setIsPaused((p) => !p)} />
            <button aria-label="next" className={`${styles.zone} ${styles.right}`} onClick={goNext} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stories;
