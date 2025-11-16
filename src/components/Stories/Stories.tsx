"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./Stories.module.css";
import { UserStories } from "@/data/stories";

type Props = {
  stories: UserStories[];
  startUserIndex?: number;
  onClose?: () => void;
  loop?: boolean;
};

const DEFAULT_IMAGE_DURATION = 5000;
const PROGRESS_UPDATE_MS = 50;

const Stories = ({ stories, startUserIndex = 0, onClose, loop = false }: Props) => {
  const [userIndex, setUserIndex] = useState(startUserIndex);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentUser = stories[userIndex];
  const currentMedia = currentUser?.media[mediaIndex];
  const duration = currentMedia?.duration ?? DEFAULT_IMAGE_DURATION;

  // Preload next media
  useEffect(() => {
    const nextMedia = currentUser?.media[mediaIndex + 1];
    if (!nextMedia) return;
    if (nextMedia.type === "image") {
      const img = new Image();
      img.src = nextMedia.url;
    } else {
      const v = document.createElement("video");
      v.src = nextMedia.url;
      v.preload = "auto";
    }
  }, [mediaIndex, currentUser]);

  // Clear and start timer for progress
  useEffect(() => {
    if (!currentMedia) return;
    setProgress(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (currentMedia.type === "video" && videoRef.current) {
      const video = videoRef.current;
      const onTime = () => setProgress(Math.min(1, video.currentTime / video.duration));
      const onEnded = () => handleNext();

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
          elapsed += PROGRESS_UPDATE_MS;
          setProgress(Math.min(1, elapsed / duration));
          if (elapsed >= duration) handleNext();
        }, PROGRESS_UPDATE_MS);
      }

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [currentMedia, isPaused]);

  // Functions to navigate
const handleNext = useCallback(() => {
  if (!currentUser) return;

  if (mediaIndex + 1 < currentUser.media.length) {
    setMediaIndex(mediaIndex + 1);
  } else if (userIndex + 1 < stories.length) {
    setUserIndex(userIndex + 1);
    setMediaIndex(0);
  } else if (loop) {
    setUserIndex(0);
    setMediaIndex(0);
  } else {
    onClose?.();
  }
}, [mediaIndex, userIndex, currentUser, stories.length, loop, onClose]);

const handlePrev = useCallback(() => {
  if (mediaIndex > 0) {
    setMediaIndex(mediaIndex - 1);
  } else if (userIndex > 0) {
    const prevUser = stories[userIndex - 1];
    setUserIndex(userIndex - 1);
    setMediaIndex(prevUser.media.length - 1);
  }
}, [mediaIndex, userIndex, stories]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlePrev, handleNext, onClose]);

  // Pointer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startTime = 0;

    const onDown = (e: PointerEvent) => {
      startX = e.clientX;
      startTime = Date.now();
      setIsPaused(true);
    };

    const onUp = (e: PointerEvent) => {
      setIsPaused(false);
      const dt = Date.now() - startTime;
      const dx = e.clientX - startX;
      const rect = el.getBoundingClientRect();
      if (dt < 300 && Math.abs(dx) < 30) {
        if (e.clientX - rect.left < rect.width / 3) handlePrev();
        else if (e.clientX - rect.left > (rect.width * 2) / 3) handleNext();
        else setIsPaused((p) => !p);
      }
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [handlePrev, handleNext]);

  if (!currentUser || !currentMedia) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.container} ref={containerRef}>
        <header className={styles.header}>
          <div className={styles.user}>
            <img src={currentUser.user.avatar} className={styles.avatar} />
            <div className={styles.username}>{currentUser.user.username}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        <div className={styles.progressRow}>
          {currentUser.media.map((_, i) => (
            <div key={i} className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ transform: `scaleX(${i === mediaIndex ? progress : i < mediaIndex ? 1 : 0})` }}
              />
            </div>
          ))}
        </div>

        <div className={styles.mediaArea}>
          {currentMedia.type === "image" ? (
            <img src={currentMedia.url} className={styles.mediaImage} draggable={false} />
          ) : (
            <video ref={videoRef} src={currentMedia.url} className={styles.mediaVideo} playsInline preload="auto" />
          )}
          <div className={styles.hitZones}>
            <button className={`${styles.zone} ${styles.left}`} onClick={handlePrev} />
            <button className={`${styles.zone} ${styles.center}`} onClick={() => setIsPaused((p) => !p)} />
            <button className={`${styles.zone} ${styles.right}`} onClick={handleNext} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stories;
