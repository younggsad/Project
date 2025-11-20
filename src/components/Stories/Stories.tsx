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
  onUserChange?: (userId: number, storyIdx: number) => void; // (userId, indexWithinUser)
  loop?: boolean;
};

const DEFAULT_IMAGE_DURATION = 5000;
const PROGRESS_TICK_MS = 50;

const Stories = ({ items, startIndex, onClose, onUserChange, loop = false }: Props) => {
  const [index, setIndex] = useState<number>(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.05);

  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prevUserRef = useRef<number | null>(null);

  // guard
  if (!items || items.length === 0) return null;
  if (index < 0 || index >= items.length) return null;

  const current = items[index];
  if (!current) return null;

  // compute indices of items that belong to current.userId
  const userIndices = items
    .map((it, ii) => ({ it, ii }))
    .filter(x => x.it.userId === current.userId)
    .map(x => x.ii);

  // position within this user's stories (0..N-1)
  const posInUser = userIndices.indexOf(index);
  const duration = current.media.duration ?? (current.media.type === "image" ? DEFAULT_IMAGE_DURATION : 0);

  // ensure video element applies volume/mute when changed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // notify parent about visible story (in effect to avoid setState during render)
  useEffect(() => {
    // call onUserChange with the index inside user's array
    if (typeof onUserChange === "function") {
      onUserChange(current.userId, posInUser);
    }
    // update prevUserRef
    prevUserRef.current = current.userId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current.userId, posInUser]); // deliberately only depend on index/current.userId/posInUser

  // preload next media
  useEffect(() => {
    const next = items[index + 1];
    if (!next) return;
    if (next.media.type === "image") {
      const img = new Image();
      img.src = next.media.url;
    } else {
      // precreate video element to hint browser
      const v = document.createElement('video');
      v.src = next.media.url;
      v.preload = 'auto';
    }
  }, [index, items]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goNext = useCallback(() => {
    setIndex(i => {
      const next = i + 1;
      if (next >= items.length) {
        if (loop) return 0;
        onClose();
        return i;
      }
      return next;
    });
    setProgress(0);
    clearTimer();
  }, [items.length, loop, onClose, clearTimer]);

  const goPrev = useCallback(() => {
    setIndex(i => Math.max(0, i - 1));
    setProgress(0);
    clearTimer();
  }, [clearTimer]);

  // progress handling
  useEffect(() => {
    // clear previous timers/listeners
    clearTimer();
    setProgress(0);

    if (current.media.type === "video") {
      const v = videoRef.current;
      if (!v) return;

      const onTime = () => {
        if (v.duration && !isNaN(v.duration)) {
          setProgress(Math.min(1, v.currentTime / v.duration));
        }
      };
      const onEnded = () => goNext();

      v.addEventListener('timeupdate', onTime);
      v.addEventListener('ended', onEnded);

      // ensure volume/mute apply
      v.volume = volume;
      v.muted = isMuted;

      if (!isPaused) v.play().catch(() => {});
      else v.pause();

      return () => {
        v.removeEventListener('timeupdate', onTime);
        v.removeEventListener('ended', onEnded);
      };
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
      return () => clearTimer();
    }
  }, [current, isPaused, goNext, duration]);

  // keyboard: left/right/escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, onClose]);

  // click/touch hit zones
  const handleZoneClick = (zone: "prev" | "toggle" | "next") => {
    if (zone === "prev") goPrev();
    if (zone === "next") goNext();
    if (zone === "toggle") setIsPaused(p => !p);
  };

  // Render
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.user}>
            <img src={current.avatar} className={styles.avatar} />
            <div className={styles.username}>{current.username}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </header>

        {/* Progress row: render one segment per media of current user */}
        <div className={styles.progressRow}>
          {userIndices.map((globalIndex, pos) => (
            <div key={globalIndex} className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  transform:
                    pos === posInUser
                      ? `scaleX(${progress})`
                      : pos < posInUser
                        ? 'scaleX(1)'
                        : 'scaleX(0)'
                }}
              />
            </div>
          ))}
        </div>

        {/* Media area */}
        <div className={styles.mediaArea}>
          {current.media.type === 'image' ? (
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

          {/* Hit zones */}
          <div className={styles.hitZones}>
            <button className={`${styles.zone} ${styles.left}`} onClick={() => handleZoneClick("prev")} />
            <button className={`${styles.zone} ${styles.center}`} onClick={() => handleZoneClick("toggle")} />
            <button className={`${styles.zone} ${styles.right}`} onClick={() => handleZoneClick("next")} />
          </div>

          {/* Controls left (mute button + slider) */}
          <div className={styles.controlsLeft}>
            {current.media.type === 'video' && (
              <>
                <button
                  className={styles.soundBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(m => !m);
                  }}
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    if (v > 0 && isMuted) setIsMuted(false);
                    // apply immediately to element if present:
                    if (videoRef.current) videoRef.current.volume = v;
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
